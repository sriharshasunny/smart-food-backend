const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../utils/supabase');
const orderService = require('../orders/orderService');

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Client
// ─────────────────────────────────────────────────────────────────────────────
function getModel(json = true) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: json ? { responseMimeType: 'application/json' } : {}
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Gemini–based intent + entity extraction (single call)
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeMessage(message, contextString) {
    const model = getModel(true);
    if (!model) return localFallback(message);

    const prompt = `
You are the AI brain of a food delivery chatbot. Analyze the user message and return ONLY a raw JSON object.

Intents available:
- search_food       → user wants to find specific food items (e.g. "top 10 biryanis", "best ice creams", "chicken under 300")
- recommend_food    → user wants personalized suggestions (e.g. "recommend something", "what should I eat")
- restaurant_search → user wants to find restaurants (e.g. "restaurants near me", "top rated restaurants")
- restaurant_foods  → user wants food from a specific restaurant (e.g. "show food from Burger King")
- order_history     → user wants to see past orders
- add_to_cart       → user wants to add something to cart
- food_question     → user asks a question about food (e.g. "is pizza spicy?", "what is biryani?")
- app_help          → user asks how the app works
- general_chat      → general greeting or casual conversation
- unknown           → completely unrelated

Entity extraction rules:
- food_name: Extract EXACTLY what food they want. "best top 10 ice creams and biryanis" → "ice cream,biryani". Singular form preferred. "biryanis" → "biryani".
- price_max: Extract price limit number if mentioned (e.g. "under 300" → 300)
- veg: true if user specified veg, false if non-veg/chicken/meat, null otherwise
- limit: How many results user wants (e.g. "top 10" → 10, "5 best" → 5, default: 8)
- restaurant_name: If user asks for a specific restaurant's food

CRITICAL RULES:
1. If user mentions ANY food item → intent MUST be search_food, NOT recommend_food
2. NEVER ask for clarification — just infer the best intent and entities from context
3. Limit must always be a number between 1 and 20

Context: ${contextString || "None"}

User message: "${message}"

Return ONLY this JSON (no markdown):
{
  "intent": "search_food",
  "food_name": "biryani,ice cream",
  "price_max": null,
  "veg": null,
  "limit": 10,
  "restaurant_name": null,
  "clarification": null
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(text);
        console.log('[ChatController] Gemini analysis:', parsed);
        return parsed;
    } catch (e) {
        console.error('[ChatController] Gemini error:', e.message);
        return localFallback(message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1b: Local keyword fallback
// ─────────────────────────────────────────────────────────────────────────────
function localFallback(message) {
    const m = message.toLowerCase();
    const priceMatch = m.match(/(?:under|below|less than|max|upto)\s*(?:rs\.?|₹)?\s*(\d+)/i);
    const limitMatch = m.match(/\b(?:top|best|give|show|get)?\s*(\d+)\b/i);
    const foodMatch = m.match(/\b(biryani|pizza|burger|ice cream|icecream|pasta|noodles|dosa|idli|sandwich|momos|fried rice|paneer|chicken|mutton|fish|sushi|salad|wrap|waffles?|coffee|chai|tea|cake|dessert|dal|roti|paratha)\b/i);

    if (foodMatch) {
        return {
            intent: 'search_food',
            food_name: foodMatch[1].replace(/s$/, ''),
            price_max: priceMatch ? parseInt(priceMatch[1]) : null,
            veg: /\bveg\b/i.test(m) && !/non.?veg/i.test(m) ? true : /non.?veg|chicken|mutton|meat|fish/i.test(m) ? false : null,
            limit: limitMatch ? Math.min(parseInt(limitMatch[1]), 20) : 8,
            restaurant_name: null,
            clarification: null
        };
    }
    if (/my order|past order|order history/i.test(m)) return { intent: 'order_history', limit: 5 };
    if (/restaurant/i.test(m)) return { intent: 'restaurant_search', limit: 8 };
    if (/trending|popular|top rated/i.test(m)) return { intent: 'recommend_food', limit: 8 };
    return { intent: 'general_chat', limit: 8 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Fetch foods from DB with filters
// ─────────────────────────────────────────────────────────────────────────────
async function fetchFoodsFromDB(analysis) {
    const { food_name, price_max, veg, limit = 8 } = analysis;
    const foods = [];

    // Support multiple food names (e.g. "ice cream,biryani")
    const foodNames = food_name
        ? food_name.split(',').map(f => f.trim().replace(/s$/i, '').trim()).filter(Boolean)
        : [];

    if (foodNames.length === 0 && !price_max && veg === null) {
        // No specific food → fetch trending
        const { data } = await supabase.from('foods')
            .select('*, restaurant:restaurant_id(id, name, address, rating)')
            .eq('available', true)
            .order('rating', { ascending: false })
            .limit(limit);
        return data || [];
    }

    for (const name of (foodNames.length > 0 ? foodNames : [''])) {
        let q = supabase.from('foods')
            .select('*, restaurant:restaurant_id(id, name, address, rating)')
            .eq('available', true);

        if (name) {
            q = q.or(`name.ilike.%${name}%,category.ilike.%${name}%,description.ilike.%${name}%`);
        }
        if (price_max) q = q.lte('price', price_max);
        if (typeof veg === 'boolean') q = q.eq('is_veg', veg);

        const perName = Math.ceil(limit / Math.max(foodNames.length, 1));
        const { data } = await q.order('rating', { ascending: false }).limit(perName);
        if (data) foods.push(...data);
    }

    // Dedupe by id
    const seen = new Set();
    return foods.filter(f => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Fetch recommendations
// ─────────────────────────────────────────────────────────────────────────────
async function fetchRecommendations(userId, analysis) {
    if (!userId) return [];
    try {
        const recommendationEngine = require('../recommendation/recommendationEngine');
        return await recommendationEngine.getRecommendations(userId, {
            food_name: analysis.food_name,
            price_max: analysis.price_max,
            veg: analysis.veg,
            limit: analysis.limit || 8
        });
    } catch (e) {
        console.error('[ChatController] Recommendation engine error:', e.message);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Fetch restaurants
// ─────────────────────────────────────────────────────────────────────────────
async function fetchRestaurants(analysis) {
    let q = supabase.from('restaurants')
        .select('id, name, address, rating, cuisine_type, foods(id, name, price, is_veg, rating)')
        .eq('is_active', true);

    if (analysis.restaurant_name) q = q.ilike('name', `%${analysis.restaurant_name}%`);

    const { data } = await q.order('rating', { ascending: false }).limit(analysis.limit || 8);
    return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Friendly Gemini message
// ─────────────────────────────────────────────────────────────────────────────
async function buildFriendlyMessage(message, intent, resultCount) {
    const model = getModel(false);
    if (!model || resultCount === 0) {
        if (resultCount === 0) return "Hmm, I couldn't find anything matching that. Try a different search! 🔍";
        return "Here are your results!";
    }

    const prompt = `You are a friendly food delivery assistant. The user said: "${message}". 
You found ${resultCount} results for intent "${intent}".
Write a single warm, natural sentence (max 12 words) introducing the results. 
No markdown, no lists, no emoji overload. Just one clean sentence.`;

    try {
        const r = await model.generateContent(prompt);
        return r.response.text().trim();
    } catch {
        return `Here are ${resultCount} great options for you! 🎉`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generative answer for conversational intents
// ─────────────────────────────────────────────────────────────────────────────
async function generateConversationalAnswer(message, intent) {
    const model = getModel(false);
    if (!model) return "I'm your food delivery assistant! Ask me for food, restaurants, or your orders.";

    const prompt = `You are a professional food delivery assistant. User said: "${message}" (Intent: ${intent}).
Respond in 1-2 natural sentences. If it's a food question, answer it. If it's app help, explain ordering. If unrelated, politely redirect them to food.`;

    try {
        const r = await model.generateContent(prompt);
        return r.response.text().trim();
    } catch {
        return "I'm here to help you find great food! What are you craving today? 🍴";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
exports.processChatRequest = async (req, res) => {
    try {
        const { message, userId, history = [] } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: 'Message is required.' });

        // Save to chat history (non-blocking)
        if (userId) {
            supabase.from('chat_history').insert({ user_id: userId, role: 'user', content: message, created_at: new Date().toISOString() }).then(() => {});
        }

        // Build context from recent history
        const contextString = history.slice(-4)
            .map(m => `${m.sender === 'user' ? 'User' : 'Bot'}: ${m.content || m.message}`)
            .join('\n');

        // STEP 1: Analyze intent + entities
        const analysis = await analyzeMessage(message, contextString);
        const { intent, clarification } = analysis;

        console.log(`[ChatController] Intent: ${intent}`, analysis);

        // STEP 2: Route by intent
        let responseType = 'text';
        let data = [];
        let friendlyMessage = '';

        if (['food_question', 'app_help', 'general_chat', 'unknown'].includes(intent)) {
            // Pure conversational — no DB needed
            friendlyMessage = await generateConversationalAnswer(message, intent);
            responseType = 'text';

        } else if (intent === 'order_history') {
            try {
                const orders = await orderService.getUserOrders(userId, 10);
                data = orders;
            } catch (e) {
                const { data: rawOrders } = await supabase.from('orders')
                    .select('*, items:order_items(*, food:foods(*, restaurant:restaurants(*)))')
                    .eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
                data = rawOrders || [];
            }
            friendlyMessage = data.length > 0 ? "Here are your recent orders." : "I couldn't find any recent orders.";
            responseType = 'get_orders';

        } else if (intent === 'restaurant_search' || intent === 'restaurant_foods') {
            data = await fetchRestaurants(analysis);
            friendlyMessage = data.length > 0
                ? `Found ${data.length} restaurants for you! 🏪`
                : "No restaurants found for that search. Try a broader query!";
            responseType = 'search_restaurant';

        } else if (intent === 'recommend_food') {
            // Personalized recommendations — try engine first, fallback to DB
            const [recs, dbFoods] = await Promise.all([
                fetchRecommendations(userId, analysis),
                fetchFoodsFromDB(analysis)
            ]);

            // Merge: recs first, then DB fills up remaining slots
            const seen = new Set();
            const merged = [];
            for (const f of [...recs, ...dbFoods]) {
                if (!seen.has(f.id)) { seen.add(f.id); merged.push(f); }
                if (merged.length >= (analysis.limit || 8)) break;
            }
            data = merged;
            friendlyMessage = data.length > 0
                ? await buildFriendlyMessage(message, intent, data.length)
                : "I couldn't find personalized recommendations right now. Try searching for something specific!";
            responseType = 'search_food';

        } else {
            // search_food (default for any food query)
            const [dbFoods, recs] = await Promise.all([
                fetchFoodsFromDB(analysis),
                userId ? fetchRecommendations(userId, analysis) : Promise.resolve([])
            ]);

            // Merge DB results + relevant recs, DB takes priority for specific searches
            const seen = new Set();
            const merged = [];
            for (const f of [...dbFoods, ...recs]) {
                if (!seen.has(f.id)) { seen.add(f.id); merged.push(f); }
                if (merged.length >= (analysis.limit || 8)) break;
            }
            data = merged;
            friendlyMessage = data.length > 0
                ? await buildFriendlyMessage(message, intent, data.length)
                : "No items found for that search. Try something else! 🔍";
            responseType = 'search_food';
        }

        // Save assistant response
        if (userId) {
            supabase.from('chat_history').insert({ user_id: userId, role: 'assistant', content: friendlyMessage, created_at: new Date().toISOString() }).then(() => {});
        }

        return res.json({
            type: responseType,
            message: friendlyMessage,
            data: data.length > 0 ? data : undefined
        });

    } catch (error) {
        console.error('[ChatController] Unhandled error:', error.stack || error.message);
        return res.status(500).json({ type: 'text', message: "Something went wrong. Please try again! 🙏" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/chat/history
// ─────────────────────────────────────────────────────────────────────────────
exports.getChatHistory = async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json([]);
    try {
        const { data } = await supabase.from('chat_history')
            .select('*').eq('user_id', userId)
            .order('created_at', { ascending: true }).limit(200);
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
