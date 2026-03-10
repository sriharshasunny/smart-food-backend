const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../utils/supabase');

// ── Retry helper ─────────────────────────────────────────────────────────────
async function generateWithRetry(model, prompt, maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (err) {
            const msg = err?.message || '';
            const is503 = err?.status === 503 || msg.includes('503');
            const is429 = err?.status === 429 || msg.includes('429') || msg.includes('Too Many Requests');
            const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/);
            if ((is503 || is429) && attempt < maxRetries) {
                const delay = retryMatch ? Math.min(parseFloat(retryMatch[1]) * 1000, 8000) : attempt * 1500;
                console.warn(`[Chat] Gemini ${err?.status} attempt ${attempt}, retry in ${delay}ms`);
                await new Promise(r => setTimeout(r, delay));
            } else throw err;
        }
    }
}

// ── LOCAL KEYWORD FAST-PATH ───────────────────────────────────────────────────
// Detect common queries without hitting Gemini at all → ~0ms intent detection
function detectIntentLocally(message) {
    const m = message.toLowerCase();

    // Trending / popular
    if (/trending|popular|top rated|best rated|top food|recommended/i.test(m))
        return { intent: 'trending_items', filters: {} };

    // Veg only
    if (/\bveg\b(?:etarian)?.*food|\bveg\b.*option|\bveg\b.*item|only veg|pure veg/i.test(m))
        return { intent: 'search_food', filters: { veg: true, limit: 8 } };

    // Non-veg
    if (/non.?veg|nonveg|chicken|mutton|fish|prawn|egg.*food|meat/i.test(m) && !/restaurant/i.test(m))
        return { intent: 'search_food', filters: { veg: false, limit: 8 } };

    // Specific foods  
    const foodMatch = m.match(/(?:show me |find |get |want |craving |order |best |good )?(biryani|burger|pizza|pasta|noodles|dosa|idli|sandwich|roll|momos|fried rice|manchurian|paneer|sushi|tacos?|ramen|soup)\b/i);
    if (foodMatch)
        return { intent: 'search_food', filters: { food_name: foodMatch[1], limit: 6 } };

    // Offers / deals
    if (/offer|deal|discount|coupon|promo|sale|cheap|budget/i.test(m))
        return { intent: 'get_offers', filters: {} };

    // Orders
    if (/my order|past order|order history|previous order|reorder|what did i order/i.test(m))
        return { intent: 'get_orders', filters: {} };

    // Open now
    if (/open now|open today|open at night|what.?s open/i.test(m))
        return { intent: 'open_now', filters: {} };

    return null; // needs Gemini
}

// ── Friendly message for each intent (no Gemini needed) ─────────────────────
function getFastMessage(intent, filters, resultCount) {
    if (resultCount === 0) {
        return "Hmm, I couldn't find anything matching that right now. Try a different search! 🔍";
    }
    if (intent === 'trending_items') return `Here's what's trending right now 🔥 — ${resultCount} hot picks for you!`;
    if (intent === 'get_offers') return `Found ${resultCount} great deals for you! 🏷️ Grab them before they're gone.`;
    if (intent === 'get_orders') return `Here are your recent orders 📦. Want to reorder something?`;
    if (intent === 'open_now') return `These restaurants are open right now! 🏪`;
    if (intent === 'search_food' && filters?.veg === true)
        return `Here are the best veg options available right now 🥦 — ${resultCount} choices!`;
    if (intent === 'search_food' && filters?.veg === false)
        return `Craving non-veg? Here are ${resultCount} delicious options 🍗!`;
    if (intent === 'search_food' && filters?.food_name)
        return `Found ${resultCount} matches for "${filters.food_name}" 😋 — enjoy!`;
    return `Here are ${resultCount} great options for you! 🎉`;
}

// ── Save to Supabase (best-effort) ───────────────────────────────────────────
async function saveChatHistory(userId, role, content) {
    if (!userId) return;
    try {
        await supabase.from('chat_history').insert({
            user_id: userId, role, content,
            created_at: new Date().toISOString()
        });
    } catch (_) { }
}

// ── GET /api/chat/history ────────────────────────────────────────────────────
exports.getChatHistory = async (req, res) => {
    const { userId, date } = req.query;
    if (!userId) return res.json([]);
    try {
        let query = supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        if (date) {
            query = query.gte('created_at', `${date}T00:00:00.000Z`).lte('created_at', `${date}T23:59:59.999Z`);
        } else {
            query = query.limit(200);
        }
        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ── POST /api/chat ───────────────────────────────────────────────────────────
exports.processChatRequest = async (req, res) => {
    try {
        const { message, userId, history = [] } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });

        saveChatHistory(userId, 'user', message); // non-blocking

        // ── Step 1: Try local detection first (instant) ───────────────────
        let localIntent = detectIntentLocally(message);
        let intent, filters;

        if (localIntent) {
            // Fast path: no Gemini call needed for intent
            intent = localIntent.intent;
            filters = localIntent.filters;
            console.log('[Chat] Fast-path intent:', intent, filters);
        } else {
            // ── Step 2: Single Gemini call for intent + response together ─
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                return res.json({ type: 'text', message: 'AI service unavailable. Please contact support.' });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: { responseMimeType: 'application/json' }
            });

            const ctx = history.length > 0
                ? history.slice(-4).map(m => `${m.sender === 'user' ? 'User' : 'Bot'}: ${m.content || m.message}`).join('\n')
                : '';

            // Single combined prompt: returns intent + friendly_message together
            const combinedPrompt = `
You are a food delivery AI assistant. Given the user's message, return a JSON object with:
- "intent": one of: search_food, search_restaurant, get_orders, get_offers, trending_items, open_now, general_info
- "filters": object. For search_food: food_name(string), veg(boolean), price_max(num), limit(num 6-8). For search_restaurant: restaurant_name, location.
- "friendly_message": a warm 1-sentence response (max 15 words). For general_info, this IS the response. For others, it's a brief intro.
- "clarification_question": only for general_info intent, same as friendly_message. Otherwise null.

Rules: If veg mentioned → filters.veg=true. If non-veg/chicken/meat → filters.veg=false. Budget/cheap → price_max:200.
${ctx ? `Recent chat:\n${ctx}\n` : ''}User: "${message}"

Return ONLY valid JSON, no markdown.`.trim();

            try {
                const result = await generateWithRetry(model, combinedPrompt);
                const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
                intent = parsed.intent;
                filters = parsed.filters || {};

                // For general_info, respond immediately
                if (intent === 'general_info') {
                    const reply = parsed.friendly_message || parsed.clarification_question || "What are you in the mood for? Try biryani, pizza, or check your orders!";
                    saveChatHistory(userId, 'assistant', reply);
                    return res.json({ type: 'text', message: reply });
                }

                // Store the friendly_message for later use (override DB-based one if AI gave a good one)
                filters._aiMessage = parsed.friendly_message;
                console.log('[Chat] Gemini intent:', intent, filters);

            } catch (aiErr) {
                console.error('[Chat] Gemini error:', aiErr.message);
                const fallback = "Sorry, I had trouble understanding that. Try: 'Show me biryani' or 'Veg food options'.";
                saveChatHistory(userId, 'assistant', fallback);
                return res.json({ type: 'text', message: fallback });
            }
        }

        // ── Step 3: Database query ────────────────────────────────────────
        let dbResult = { available: [], unavailable: [], similar: [] };
        if (intent === 'search_food') dbResult = await advancedSearchFood(filters);
        else if (intent === 'search_restaurant') dbResult.available = await searchRestaurants(filters);
        else if (intent === 'get_orders') dbResult = await advancedGetOrders(userId, filters);
        else if (intent === 'get_offers') dbResult.available = await getOffers();
        else if (intent === 'trending_items') dbResult.available = await getTrendingItems();
        else if (intent === 'open_now') dbResult.available = await searchRestaurants({ open_now: true });

        // ── Step 4: Build response ────────────────────────────────────────
        let finalData = intent === 'get_orders'
            ? (dbResult.unavailable.length > 0 && dbResult.similar.length > 0
                ? (intent = 'search_food', [...dbResult.available, ...dbResult.similar])
                : (dbResult.original_orders || dbResult.available))
            : [...dbResult.available, ...dbResult.similar];

        // Use AI's message if available (Gemini path), else fast local message
        const finalMessage = filters._aiMessage || getFastMessage(intent, filters, finalData.length);
        delete filters._aiMessage;

        saveChatHistory(userId, 'assistant', finalMessage);
        return res.json({ type: intent, data: finalData, message: finalMessage });

    } catch (error) {
        console.error('[Chat] Unhandled error:', error.stack || error.message);
        return res.status(500).json({ type: 'text', message: "Something went wrong. Please try again! 🙏" });
    }
};

// ── Database helpers ──────────────────────────────────────────────────────────

async function advancedSearchFood(filters) {
    let query = supabase.from('foods').select('*, restaurant:restaurants(*)');

    if (filters.food_name) {
        const words = filters.food_name.split(',').map(w => w.replace(/[^a-zA-Z0-9 ]/g, '').trim()).filter(Boolean);
        const orConditions = words.flatMap(w => [
            `name.ilike.%${w}%`, `category.ilike.%${w}%`, `description.ilike.%${w}%`
        ]);
        if (orConditions.length) query = query.or(orConditions.join(','));
    }

    if (filters.price_max) query = query.lte('price', filters.price_max);
    if (filters.price_min) query = query.gte('price', filters.price_min);
    if (typeof filters.veg === 'boolean') query = query.eq('is_veg', filters.veg);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(Math.min(filters.limit || 8, 20));
    if (error) throw error;

    const available = [], unavailable = [];
    (data || []).forEach(item => (item.available === false ? unavailable : available).push(item));
    return { available, unavailable, similar: [] };
}

async function advancedGetOrders(userId, filters) {
    if (!userId) return { available: [], unavailable: [], similar: [], empty_reason: 'Not logged in.' };
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, food:foods(*, restaurant:restaurants(*)))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
    if (error) throw error;
    if (!orders?.length) return { available: [], unavailable: [], similar: [], original_orders: [] };

    const available = [], unavailable = [], cats = new Set(), rests = new Set();
    orders.forEach(o => (o.items || []).forEach(({ food }) => {
        if (!food) return;
        if (food.available === false) {
            if (!unavailable.find(f => f.id === food.id)) {
                unavailable.push(food);
                if (food.category) cats.add(food.category);
                if (food.restaurant?.id) rests.add(food.restaurant.id);
            }
        } else if (!available.find(f => f.id === food.id)) available.push(food);
    }));

    let similar = [];
    if (unavailable.length > 0) {
        let q = supabase.from('foods').select('*, restaurant:restaurants(*)').eq('available', true);
        const conds = [];
        if (cats.size) conds.push(`category.in.(${[...cats].join(',')})`);
        if (rests.size) conds.push(`restaurant_id.in.(${[...rests].join(',')})`);
        if (conds.length) q = q.or(conds.join(','));
        const { data: sim } = await q.order('created_at', { ascending: false }).limit(6);
        const avSet = new Set(available.map(f => f.id));
        similar = (sim || []).filter(i => !avSet.has(i.id));
    }
    return { available, unavailable, similar, original_orders: orders };
}

async function searchRestaurants(filters) {
    let query = supabase.from('restaurants').select('*, foods(*)');
    if (filters.restaurant_name) query = query.ilike('name', `%${filters.restaurant_name}%`);
    if (filters.location) query = query.ilike('address', `%${filters.location}%`);
    const { data, error } = await query.limit(5);
    if (error) throw error;
    (data || []).forEach(r => {
        if (Array.isArray(r.foods)) {
            r.foods = r.foods.filter(f => f.available !== false)
                .sort((a, b) => (b.price || 0) - (a.price || 0))
                .slice(0, 3);
        }
    });
    return data || [];
}

async function getOffers() {
    const { data, error } = await supabase.from('foods').select('*, restaurant:restaurants(*)')
        .eq('available', true).order('created_at', { ascending: false }).limit(8);
    if (error) throw error;
    return data || [];
}

async function getTrendingItems() {
    const { data, error } = await supabase.from('foods').select('*, restaurant:restaurants(*)')
        .eq('available', true).order('created_at', { ascending: false }).limit(8);
    if (error) throw error;
    return data || [];
}
