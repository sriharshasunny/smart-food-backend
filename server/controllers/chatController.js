const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../utils/supabase');

// ── Retry helper ────────────────────────────────────────────────────────────
async function generateWithRetry(model, prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (err) {
            const statusCode = err?.status;
            const msg = err?.message || '';
            const is503 = statusCode === 503 || msg.includes('503');
            const is429 = statusCode === 429 || msg.includes('429') || msg.includes('Too Many Requests');
            const retryMatch = msg.match(/retry in (\d+(?:\.\d+)?)s/);
            if ((is503 || is429) && attempt < maxRetries) {
                const parsedDelay = retryMatch ? Math.min(parseFloat(retryMatch[1]) * 1000, 10000) : null;
                const delay = parsedDelay || attempt * 2000;
                console.warn(`[Chat] Gemini ${statusCode || 'rate-limit'} attempt ${attempt}/${maxRetries}, retry in ${delay}ms`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
}

// ── Save message to Supabase chat_history table (best-effort) ────────────────
async function saveChatHistory(userId, role, content) {
    if (!userId) return; // guest – skip
    try {
        await supabase.from('chat_history').insert({
            user_id: userId,
            role,               // 'user' | 'assistant'
            content,
            created_at: new Date().toISOString()
        });
    } catch (_) {
        // non-critical; never crash the response
    }
}

// ── GET /api/chat/history?userId=xxx&date=YYYY-MM-DD ─────────────────────────
exports.getChatHistory = async (req, res) => {
    const { userId, date } = req.query;
    if (!userId) return res.json([]);

    try {
        let query = supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (date) {
            const start = `${date}T00:00:00.000Z`;
            const end = `${date}T23:59:59.999Z`;
            query = query.gte('created_at', start).lte('created_at', end);
        } else {
            // Last 200 rows
            query = query.limit(200);
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('[Chat History]', err.message);
        return res.status(500).json({ error: err.message });
    }
};

// ── POST /api/chat ───────────────────────────────────────────────────────────
exports.processChatRequest = async (req, res) => {
    try {
        const { message, userId, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // Save user's message
        await saveChatHistory(userId, 'user', message);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.json({ type: 'text', message: 'AI service is not configured. Please contact support.', sender: 'ai' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const jsonModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });
        const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const conversationContext = history.length > 0
            ? history.map(m => `${m.sender === 'user' ? 'User' : 'SmartBot'}: ${m.content || m.message || ''}`).join('\n')
            : 'No previous messages.';

        // ── PASS 1: Intent + Filter extraction ──────────────────────────────
        const pass1Prompt = `
You are the Intent Analyzer for Smart Food Delivery app.

Supported intents:
- search_food       → user wants specific food (burger, biryani, pizza, etc.)
- search_restaurant → user wants a specific restaurant or place
- get_orders        → user wants past orders, order history, or wants to reorder
- get_offers        → user wants deals, discounts, offers
- trending_items    → user wants popular or trending food
- open_now          → user asks what restaurants are open right now
- general_info      → vague query ("I'm hungry"), greeting, or clarification needed

Filters for search_food: food_name (string, comma-separated if multiple), price_max (num), price_min (num), veg (boolean), limit (num, default 6).
Filters for search_restaurant: restaurant_name (string), location (string).

Conversation context:
${conversationContext}

User's message: "${message}"

Rules:
- If the user asks for "veg" or "vegetarian" options, set veg: true
- If user says "non-veg", set veg: false
- If the user says "cheap" or "budget", set price_max: 200
- For multi-item requests like "burgers and biryani", set food_name: "burgers,biryani"
- Always return ONLY valid JSON in this exact shape, no markdown fences:
{
  "intent": "search_food",
  "filters": {},
  "clarification_question": null
}
        `.trim();

        let structuredData;
        try {
            const pass1Result = await generateWithRetry(jsonModel, pass1Prompt);
            const pass1Text = pass1Result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            structuredData = JSON.parse(pass1Text);
        } catch (e) {
            console.error('[Chat] Pass 1 error:', e.message);
            // Friendly fallback
            const aiMsg = 'Sorry, I had trouble understanding that. Could you rephrase? For example, "Show me biryani" or "Best veg options".';
            await saveChatHistory(userId, 'assistant', aiMsg);
            return res.json({ type: 'text', message: aiMsg });
        }

        console.log('[Chat] Pass 1 →', structuredData.intent, structuredData.filters);

        // ── Handle general_info early ────────────────────────────────────────
        if (structuredData.intent === 'general_info') {
            const reply = structuredData.clarification_question || "What are you in the mood for? Try asking for biryani, pizza, veg options, or check your orders! 😊";
            await saveChatHistory(userId, 'assistant', reply);
            return res.json({ type: 'text', message: reply });
        }

        // ── DATABASE EXECUTION ───────────────────────────────────────────────
        const intent = structuredData.intent;
        const filters = structuredData.filters || {};
        let dbResult = { available: [], unavailable: [], similar: [] };

        if (intent === 'search_food') dbResult = await advancedSearchFood(filters);
        else if (intent === 'search_restaurant') dbResult.available = await searchRestaurants(filters);
        else if (intent === 'get_orders') dbResult = await advancedGetOrders(userId, filters);
        else if (intent === 'get_offers') dbResult.available = await getOffers();
        else if (intent === 'trending_items') dbResult.available = await getTrendingItems();
        else if (intent === 'open_now') dbResult.available = await searchRestaurants({ open_now: true });

        if (!dbResult.empty_reason && dbResult.available.length === 0 && dbResult.unavailable.length === 0 && dbResult.similar.length === 0) {
            if (intent === 'get_orders') dbResult.empty_reason = 'No orders found.';
            else dbResult.empty_reason = 'No items matched your search.';
        }

        // ── PASS 2: Natural language response ───────────────────────────────
        const dbSummary = {
            intent,
            found: dbResult.available.map(i => i.name || 'item'),
            unavailable: dbResult.unavailable.map(i => i.name || 'item'),
            similar: dbResult.similar.map(i => i.name || 'item'),
            empty_reason: dbResult.empty_reason
        };

        const pass2Prompt = `
You are SmartBot, the friendly AI food assistant for Smart Food Delivery.
Be warm, conversational, and enthusiastic about food.
User asked: "${message}"
Database results summary: ${JSON.stringify(dbSummary)}

Write a 1-2 sentence natural response. 
- If items were found, say something excited about them.
- If nothing was found, suggest alternatives or ask what they'd prefer.
- Do NOT list items in text (they are shown as visual cards).
- Keep it under 40 words.
Return only plain text, no JSON, no markdown.
        `.trim();

        let finalMessage = '';
        try {
            const pass2Result = await generateWithRetry(textModel, pass2Prompt);
            finalMessage = pass2Result.response.text().trim();
        } catch (e) {
            console.error('[Chat] Pass 2 error:', e.message);
            finalMessage = dbResult.empty_reason
                ? `I couldn't find exactly what you wanted. ${dbResult.empty_reason}`
                : 'Here are some great options I found for you! 🎉';
        }

        // ── Assemble final data array ────────────────────────────────────────
        let finalData = [];
        if (intent === 'get_orders') {
            if (dbResult.unavailable.length > 0 && dbResult.similar.length > 0) {
                finalData = [...dbResult.available, ...dbResult.similar];
                structuredData.intent = 'search_food';
            } else {
                finalData = dbResult.original_orders || dbResult.available;
            }
        } else {
            finalData = [...dbResult.available, ...dbResult.similar];
        }

        await saveChatHistory(userId, 'assistant', finalMessage);

        return res.json({
            type: structuredData.intent,
            data: finalData,
            message: finalMessage
        });

    } catch (error) {
        console.error('[Chat] Unhandled error:', error.stack || error.message);
        return res.status(500).json({
            type: 'text',
            message: "Something went wrong on my end. Please try again in a moment! 🙏"
        });
    }
};

// ── Database helpers ─────────────────────────────────────────────────────────

async function advancedSearchFood(filters) {
    let query = supabase.from('foods').select('*, restaurant:restaurants(*)');

    if (filters.food_name) {
        const words = filters.food_name.split(',').map(w => w.trim()).filter(Boolean);
        const orConditions = [];
        words.forEach(word => {
            const safe = word.replace(/[^a-zA-Z0-9 ]/g, '').trim();
            if (safe) orConditions.push(`name.ilike.%${safe}%,category.ilike.%${safe}%,description.ilike.%${safe}%`);
        });
        if (orConditions.length > 0) query = query.or(orConditions.join(','));
    }

    if (filters.price_max) query = query.lte('price', filters.price_max);
    if (filters.price_min) query = query.gte('price', filters.price_min);
    if (typeof filters.veg === 'boolean') query = query.eq('is_veg', filters.veg);
    if (filters.rating_min) query = query.gte('rating', filters.rating_min);

    const limit = Math.min(filters.limit || 8, 20);
    const { data, error } = await query.limit(limit);
    if (error) throw error;

    const available = [];
    const unavailable = [];
    (data || []).forEach(item => {
        (item.is_available === false ? unavailable : available).push(item);
    });

    return { available, unavailable, similar: [] };
}

async function advancedGetOrders(userId, filters) {
    if (!userId) return { available: [], unavailable: [], similar: [], empty_reason: 'User not logged in.' };

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, food:foods(*, restaurant:restaurants(*)))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(filters.limit || 5);

    if (error) throw error;
    if (!orders || orders.length === 0) return { available: [], unavailable: [], similar: [], original_orders: [] };

    const availableFoods = [];
    const unavailableFoods = [];
    const categoriesToSearch = new Set();
    const restaurantsToSearch = new Set();

    orders.forEach(order => {
        (order.items || []).forEach(orderItem => {
            const food = orderItem.food;
            if (!food) return;
            if (food.is_available === false) {
                if (!unavailableFoods.find(f => f.id === food.id)) {
                    unavailableFoods.push(food);
                    if (food.category) categoriesToSearch.add(food.category);
                    if (food.restaurant?.id) restaurantsToSearch.add(food.restaurant.id);
                }
            } else {
                if (!availableFoods.find(f => f.id === food.id)) availableFoods.push(food);
            }
        });
    });

    let similarItems = [];
    if (unavailableFoods.length > 0) {
        let similarQuery = supabase.from('foods').select('*, restaurant:restaurants(*)').eq('is_available', true);
        const orConditions = [];
        if (categoriesToSearch.size > 0) orConditions.push(`category.in.(${[...categoriesToSearch].join(',')})`);
        if (restaurantsToSearch.size > 0) orConditions.push(`restaurant_id.in.(${[...restaurantsToSearch].join(',')})`);
        if (orConditions.length > 0) similarQuery = similarQuery.or(orConditions.join(','));
        const { data: similarData } = await similarQuery.order('rating', { ascending: false }).limit(6);
        if (similarData) {
            const avSet = new Set(availableFoods.map(f => f.id));
            similarItems = similarData.filter(i => !avSet.has(i.id));
        }
    }

    return { available: availableFoods, unavailable: unavailableFoods, similar: similarItems, original_orders: orders };
}

async function searchRestaurants(filters) {
    let query = supabase.from('restaurants').select('*, foods(*)');
    if (filters.restaurant_name) query = query.ilike('name', `%${filters.restaurant_name}%`);
    if (filters.location) query = query.ilike('address', `%${filters.location}%`);
    if (filters.rating_min) query = query.gte('rating', filters.rating_min);
    const { data, error } = await query.limit(Math.min(filters.limit || 5, 10));
    if (error) throw error;
    (data || []).forEach(r => {
        if (Array.isArray(r.foods)) {
            r.foods = r.foods.filter(f => f.is_available !== false)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, filters.item_limit || 3);
        }
    });
    return data || [];
}

async function getOffers() {
    const { data, error } = await supabase
        .from('foods').select('*, restaurant:restaurants(*)')
        .eq('is_available', true)
        .order('rating', { ascending: false })
        .limit(6);
    if (error) throw error;
    return data || [];
}

async function getTrendingItems() {
    const { data, error } = await supabase
        .from('foods').select('*, restaurant:restaurants(*)')
        .eq('is_available', true)
        .order('rating', { ascending: false })
        .limit(8);
    if (error) throw error;
    return data || [];
}
