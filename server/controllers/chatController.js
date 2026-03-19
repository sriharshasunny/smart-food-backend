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

// ── Extract price limit from text ("under 200", "below 300", "less than 150") ──
function extractPriceMax(text) {
    const m = text.match(/(?:under|below|less than|max|upto|within|at most)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
}

// ── Extract numeric limit from text ("top 10", "5 best", "show 12") ──
function extractLimit(text) {
    const m = text.match(/\b(?:top|best|show|get|around|first)?\s*(\d{1,2})\b/i);
    return m ? parseInt(m[1]) : null;
}

// ── LOCAL KEYWORD FAST-PATH (Instant) ─────────────────────
function detectIntentLocally(message) {
    const m = message.toLowerCase();
    
    // Food keywords for instant search
    const foodKeywords = [
        'biryani', 'pizza', 'burger', 'chicken', 'rice', 'noodles', 'mandi', 'kabab',
        'kebab', 'shawarma', 'sandwich', 'pasta', 'sushi', 'roll', 'veg', 'non-veg',
        'paneer', 'thali', 'dosa', 'idli', 'breakfast', 'lunch', 'dinner', 'snack'
    ];

    for (const kw of foodKeywords) {
        if (m.includes(kw)) {
            return {
                intent: 'search_food',
                filters: {
                    food_name: kw,
                    price_max: extractPriceMax(message),
                    limit: extractLimit(message) || 12
                }
            };
        }
    }

    // Non-food strictly utility intents
    if (/my order|past order|order history|previous order|reorder|what did i order|show order/i.test(m))
        return { intent: 'get_orders', filters: {} };
    if (/open now|open today|open at night|what.?s open/i.test(m))
        return { intent: 'open_now', filters: {} };
    if (/\boffer|deal|discount|coupon|promo|sale\b/i.test(m))
        return { intent: 'get_offers', filters: {} };

    return null; // Go to Gemini for complex queries
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
    if (intent === 'search_food') {
        const name = filters?.food_name ? `**${filters.food_name}**` : 'food';
        const vegLabel = filters?.veg === true ? 'veg' : filters?.veg === false ? 'non-veg' : '';
        const priceLabel = filters?.price_max ? ` under ₹${filters.price_max}` : '';
        return `Found ${resultCount} ${vegLabel} ${name} options${priceLabel} 🍽️ — enjoy!`;
    }
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
            intent = localIntent.intent;
            filters = localIntent.filters;
        } else {
            // ── Step 2: Gemini for Intent ──
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return res.json({ type: 'text', message: 'AI service offline.' });

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: { responseMimeType: 'application/json' }
            });

            const ctx = history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
            const combinedPrompt = `
You are an AI food query engine. Convert the user message into structured JSON.
Return ONLY JSON.

INTENTS: search_food, search_restaurant, get_orders, get_offers, trending_items, general_info

SCHEMA:
{
  "intent": "search_food" | "search_restaurant" | "get_orders" | "get_offers" | "trending_items" | "general_info",
  "filters": { "food_name": "string", "veg": true|false, "price_max": number, "limit": number },
  "friendly_message": "string (warm acknowledgement)"
}

User: "${message}"
Context: ${ctx}`;

            try {
                const result = await generateWithRetry(model, combinedPrompt);
                const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
                intent = parsed.intent;
                filters = parsed.filters || {};
                filters._aiMessage = parsed.friendly_message;

                if (intent === 'general_info') {
                    const reply = parsed.friendly_message || "How can I help you find great food?";
                    saveChatHistory(userId, 'assistant', reply);
                    return res.json({ type: 'text', message: reply });
                }
            } catch (aiErr) {
                console.error('[Chat] Gemini error:', aiErr.message);
                intent = 'trending_items';
                filters = { limit: 6 };
            }
        }

        // ── Step 3: Database ──
        let dbResult = { available: [], unavailable: [], similar: [] };
        if (intent === 'search_food') dbResult = await advancedSearchFood(filters);
        else if (intent === 'search_restaurant') dbResult.available = await searchRestaurants(filters);
        else if (intent === 'get_orders') dbResult = await advancedGetOrders(userId, filters);
        else if (intent === 'get_offers') dbResult.available = await getOffers();
        else if (intent === 'trending_items') dbResult.available = await getTrendingItems();
        else if (intent === 'open_now') dbResult.available = await searchRestaurants({ open_now: true });

        // ── Step 4: Response ──
        let finalData = [...dbResult.available, ...dbResult.similar];
        const finalMessage = filters._aiMessage || getFastMessage(intent, filters, finalData.length);

        saveChatHistory(userId, 'assistant', finalMessage);
        return res.json({
            type: intent === 'search_restaurant' ? 'search_restaurant' : (intent === 'get_orders' ? 'get_orders' : 'search_food'),
            data: finalData,
            message: finalMessage
        });

    } catch (error) {
        console.error('[Chat] Error:', error.message);
        return res.status(500).json({ type: 'text', message: "Sorry, I hit a snag. Try again? 🙏" });
    }
};

// ── Helpers ──
async function advancedSearchFood(filters) {
    let query = supabase.from('foods').select('*, restaurant:restaurants!inner(*)').eq('restaurant.is_active', true).eq('available', true);
    if (filters.food_name) {
        const words = filters.food_name.split(',').map(w => w.trim()).filter(Boolean);
        const orStr = words.flatMap(w => [`name.ilike.%${w}%`, `category.ilike.%${w}%`]).join(',');
        if (orStr) query = query.or(orStr);
    }
    if (filters.price_max) query = query.lte('price', filters.price_max);
    if (typeof filters.veg === 'boolean') query = query.eq('is_veg', filters.veg);
    const { data, error } = await query.order('rating', { ascending: false }).limit(filters.limit || 8);
    if (error) throw error;
    return { available: data || [], unavailable: [], similar: [] };
}

async function advancedGetOrders(userId, filters) {
    const { data: orders, error } = await supabase.from('orders')
        .select('*, items:order_items(*, food:foods(*, restaurant:restaurants(*)))')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    if (error) throw error;
    if (!orders?.length) return { available: [], unavailable: [], similar: [] };
    const available = [];
    orders.forEach(o => (o.items || []).forEach(({ food }) => {
        if (food && food.available !== false && !available.find(f => f.id === food.id)) available.push(food);
    }));
    return { available, unavailable: [], similar: [], original_orders: orders };
}

async function searchRestaurants(filters = {}) {
    let query = supabase.from('restaurants').select('*, foods(*)').eq('is_active', true);
    if (filters.restaurant_name) query = query.ilike('name', `%${filters.restaurant_name}%`);
    const { data, error } = await query.order('rating', { ascending: false }).limit(6);
    if (error) throw error;
    (data || []).forEach(r => { if (r.foods) r.foods = r.foods.filter(f => f.available !== false).slice(0, 3); });
    return data || [];
}

async function getOffers() {
    const { data, error } = await supabase.from('foods').select('*, restaurant:restaurants!inner(*)')
        .eq('available', true).eq('restaurant.is_active', true).order('rating', { ascending: false }).limit(8);
    if (error) throw error;
    return data || [];
}

async function getTrendingItems() {
    return getOffers(); // Trending and Offers used same fallback in old versions
}
