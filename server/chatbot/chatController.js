const { GoogleGenerativeAI } = require("@google/generative-ai");
const supabase = require('../utils/supabase');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — local extraction, no API calls
// ─────────────────────────────────────────────────────────────────────────────

function extractPriceMax(text) {
    const m = text.match(/(?:under|below|less than|max|upto|within|at most)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
}

function extractUserLimit(text) {
    const m = text.match(/(?:^|\s)(?:top|give|show|get|best|find|fetch|list)\s+(\d+)\b/i)
        || text.match(/\b(\d+)\s+(?:best|top|great|good|tasty|popular)\b/i);
    return m ? Math.min(parseInt(m[1]), 20) : null;
}

function extractVeg(text) {
    if (/\bpure\s*veg\b|\bonly\s*veg\b|\bveg\b(?:etarian)?(?!\s*(?:etable|ie))\b/i.test(text) && !/non.?veg/i.test(text)) return true;
    if (/\bnon.?veg\b|\bchicken\b|\bmutton\b|\bfish\b|\bprawn\b|\begg food\b|\bmeat\b/i.test(text)) return false;
    return null;
}

const FOOD_TERMS = [
    'biryani','biriyani','burger','pizza','pasta','noodles','dosa','idli',
    'sandwich','roll','momos','fried rice','manchurian','paneer','sushi',
    'tacos','ramen','soup','waffles','ice cream','icecream','salad','wrap',
    'cake','dessert','coffee','chai','tea','dal','roti','paratha','chicken',
    'mutton','fish','prawn','kebab','tikka','curry','samosa','chaat','halwa',
    'kheer','lassi','shake','smoothie','fries','wings','steak','shawarma',
    'spring roll','toast','omelette','pancake','muffin','cookie','brownie',
    'pav bhaji','vada','upma','poha','gulab jamun','pad thai','dim sum'
];

function extractFoodNames(text) {
    const lower = text.toLowerCase();
    const found = [];
    // Sort longest first so "fried rice" beats "rice"
    for (const term of [...FOOD_TERMS].sort((a, b) => b.length - a.length)) {
        if (lower.includes(term) && !found.includes(term)) {
            found.push(term);
        }
    }
    return found; // may be empty
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — MODE DECISION (keyword-based, instant)
//
// Modes:
//   recommendation        → personalized engine only ("top foods", "suggest something")  
//   filtered_rec          → rec engine filtered to food names ("top biryanis")
//   db_search             → direct DB first ("show biryani", "find pizza")
//   hybrid                → both, merged ("biryani and salad", "suggest + filter")
//   restaurant_search     → restaurants
//   order_history         → orders
//   conversation          → chat / question
// ─────────────────────────────────────────────────────────────────────────────
function analyzeLocally(message) {
    const m = message.toLowerCase().trim();
    const priceMax = extractPriceMax(m);
    const veg = extractVeg(m);
    const userLimit = extractUserLimit(m);
    const limit = userLimit || 8;
    const foodNames = extractFoodNames(m);

    // ── Non-food intents first ──────────────────────────────────────────────
    if (/\b(my order|past order|order history|previous order|show order|reorder)\b/i.test(m))
        return { mode: 'order_history', foodNames: [], priceMax, veg, limit };

    if (/\b(show restaurant|find restaurant|top restaurant|best restaurant|restaurant near|open restaurant)\b/i.test(m))
        return { mode: 'restaurant_search', foodNames: [], priceMax, veg, limit };

    // ── Explicit search keywords → DB first ────────────────────────────────
    const isExplicitSearch = /\b(show|find|search|get me|fetch|look for|look up)\b/i.test(m);
    if (isExplicitSearch && foodNames.length > 0)
        return { mode: 'db_search', foodNames, priceMax, veg, limit };

    // ── Vague top/suggest → recommendation engine ───────────────────────────
    const isVague = foodNames.length === 0;
    const isTopOrSuggest = /\b(top|best|trending|popular|suggest|recommend|hot|bestseller|what.?s good)\b/i.test(m);
    if (isVague && isTopOrSuggest)
        return { mode: 'recommendation', foodNames: [], priceMax, veg, limit };

    // ── Named food + top/best → filtered recommendation ─────────────────────
    if (foodNames.length > 0 && isTopOrSuggest)
        return { mode: 'filtered_rec', foodNames, priceMax, veg, limit };

    // ── Named food without "show/find" → hybrid ─────────────────────────────
    if (foodNames.length > 0)
        return { mode: 'hybrid', foodNames, priceMax, veg, limit };

    // ── Price / veg only ────────────────────────────────────────────────────
    if (priceMax || veg !== null)
        return { mode: 'db_search', foodNames: [], priceMax, veg, limit };

    // ── Fallback — needs Gemini ──────────────────────────────────────────────
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1b — GEMINI FALLBACK for unclear queries
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeWithGemini(message, contextString) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { mode: 'conversation', foodNames: [], priceMax: null, veg: null, limit: 8 };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
Food delivery chatbot. Classify the user message and return ONLY raw JSON.

Modes:
- "recommendation"   → vague, no food mentioned ("suggest something", "I'm hungry")
- "filtered_rec"     → specific food + top/best ("top biryanis", "best pizzas")
- "db_search"        → explicit search ("show biryani", "find pizza near me")
- "hybrid"           → food mentioned but not explicitly searching ("biryani and salad")
- "restaurant_search"
- "order_history"
- "conversation"     → questions, greetings, unrelated

Extract:
- foodNames: array of food items mentioned (singular, e.g. ["biryani","salad"]). Empty [] if none.
- priceMax: number or null
- veg: true/false/null
- limit: integer 1-20 (default 8)

Context: ${contextString || 'None'}
User: "${message}"

Return ONLY:
{"mode":"...","foodNames":[],"priceMax":null,"veg":null,"limit":8}`;

    try {
        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
        console.log('[ChatController] Gemini classify:', parsed);
        return {
            mode: parsed.mode || 'conversation',
            foodNames: parsed.foodNames || [],
            priceMax: parsed.priceMax || null,
            veg: parsed.veg ?? null,
            limit: Math.min(parseInt(parsed.limit) || 8, 20)
        };
    } catch (e) {
        console.error('[ChatController] Gemini classify error:', e.message);
        return { mode: 'conversation', foodNames: [], priceMax: null, veg: null, limit: 8 };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2a — RECOMMENDATION ENGINE (personalized via engine)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchFromRecommendationEngine(userId, analysis) {
    if (!userId) return [];
    try {
        const engine = require('../recommendation/recommendationEngine');
        const recs = await engine.getRecommendations(userId, {
            limit: Math.min(analysis.limit * 4, 80) // fetch extra for filtering
        });
        return applyFilters(recs, analysis);
    } catch (e) {
        console.error('[ChatController] Rec engine error:', e.message);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2b — DATABASE SEARCH (direct, exact)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchFromDB(analysis) {
    const { foodNames, priceMax, veg, limit } = analysis;
    const cap = Math.min(parseInt(limit) || 8, 20);

    if (foodNames.length === 0) {
        // No food name — fetch with only price/veg filters
        let q = supabase.from('foods')
            .select('id, name, price, is_veg, rating, description, image, available, category, restaurant:restaurant_id(id, name, address, rating, image)')
            .eq('available', true);
        if (priceMax) q = q.lte('price', priceMax);
        if (typeof veg === 'boolean') q = q.eq('is_veg', veg);
        const { data } = await q.order('rating', { ascending: false, nullsLast: true }).limit(cap);
        return data || [];
    }

    // Separate query per food name, then merge
    const perName = Math.max(Math.ceil(cap / foodNames.length), 4);
    const seen = new Set();
    const results = [];

    for (const name of foodNames) {
        let q = supabase.from('foods')
            .select('id, name, price, is_veg, rating, description, image, available, category, restaurant:restaurant_id(id, name, address, rating, image)')
            .eq('available', true)
            .or(`name.ilike.%${name}%,category.ilike.%${name}%`);
        if (priceMax) q = q.lte('price', priceMax);
        if (typeof veg === 'boolean') q = q.eq('is_veg', veg);
        const { data } = await q.order('rating', { ascending: false, nullsLast: true }).limit(perName);
        for (const f of (data || [])) {
            if (!seen.has(f.id)) { seen.add(f.id); results.push(f); }
        }
    }

    return results.slice(0, cap);
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter helper — apply price, veg, food name filters on any array
// ─────────────────────────────────────────────────────────────────────────────
function applyFilters(items, analysis) {
    const { foodNames, priceMax, veg, limit } = analysis;
    const cap = Math.min(parseInt(limit) || 8, 20);

    let filtered = items;

    if (priceMax) filtered = filtered.filter(f => f.price <= priceMax);
    if (typeof veg === 'boolean') filtered = filtered.filter(f => f.is_veg === veg);

    if (foodNames.length > 0) {
        filtered = filtered.filter(f => {
            const n = (f.name || '').toLowerCase();
            const c = (f.category || '').toLowerCase();
            return foodNames.some(term => n.includes(term) || c.includes(term));
        });
    }

    return filtered.slice(0, cap);
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge two lists, deduplicate by id
// ─────────────────────────────────────────────────────────────────────────────
function mergeResults(primary, secondary, cap) {
    const seen = new Set();
    const merged = [];
    for (const f of [...primary, ...secondary]) {
        if (!seen.has(f.id) && merged.length < cap) {
            seen.add(f.id);
            merged.push(f);
        }
    }
    return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2c — HYBRID: rec engine filtered, fill from DB if not enough
// ─────────────────────────────────────────────────────────────────────────────
async function fetchHybrid(userId, analysis) {
    const cap = Math.min(parseInt(analysis.limit) || 8, 20);

    const [recResults, dbResults] = await Promise.all([
        fetchFromRecommendationEngine(userId, analysis),
        fetchFromDB(analysis)
    ]);

    return mergeResults(recResults, dbResults, cap);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Restaurant & Order helpers
// ─────────────────────────────────────────────────────────────────────────────
async function fetchRestaurants(analysis) {
    let q = supabase.from('restaurants')
        .select('id, name, address, rating, cuisine_type, image, is_active, foods(id, name, price, is_veg, rating)')
        .eq('is_active', true);
    const { data } = await q.order('rating', { ascending: false, nullsLast: true }).limit(Math.min(analysis.limit || 8, 15));
    return data || [];
}

async function fetchOrders(userId) {
    if (!userId) return [];
    const { data } = await supabase.from('orders')
        .select('*, items:order_items(*, food:foods(*, restaurant:restaurants(*)))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
    return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Friendly message (Gemini or local fallback)
// ─────────────────────────────────────────────────────────────────────────────
async function buildMessage(userMessage, analysis, resultCount) {
    if (resultCount === 0) {
        const what = analysis.foodNames.length > 0 ? analysis.foodNames.join(' or ') : 'that';
        return `I couldn't find anything for ${what}. Try a broader search! 🔍`;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return localMessage(analysis, resultCount);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const r = await model.generateContent(
            `Food delivery chatbot. User said: "${userMessage}". Found ${resultCount} results. Write ONE natural, warm sentence (max 12 words) introducing results. No markdown.`
        );
        return r.response.text().trim();
    } catch {
        return localMessage(analysis, resultCount);
    }
}

function localMessage(analysis, count) {
    if (!count) return "No results found. Try a different search! 🔍";
    const names = analysis.foodNames;
    if (names.length > 0) return `Here are ${count} great ${names.join(' and ')} options for you! 😋`;
    if (analysis.priceMax) return `Found ${count} options under ₹${analysis.priceMax}! 🎉`;
    if (analysis.veg === true) return `Here are ${count} veg options for you! 🥦`;
    if (analysis.veg === false) return `Here are ${count} non-veg options for you! 🍗`;
    return `Here are ${count} top picks for you! 🔥`;
}

async function generateConversationalReply(message) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "Hi! I'm your food delivery assistant. Ask me for food, restaurants, or your orders! 🍴";
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const r = await model.generateContent(
            `You are a professional food delivery assistant. User said: "${message}".
Respond naturally in 1-2 sentences. Answer food questions helpfully. For unrelated topics, politely redirect to food ordering.`
        );
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

        const contextString = history.slice(-4)
            .map(m => `${m.sender === 'user' ? 'User' : 'Bot'}: ${m.content || m.message}`)
            .join('\n');

        // ── Step 1: Classify intent/mode ─────────────────────────────────
        let analysis = analyzeLocally(message);
        if (!analysis) {
            analysis = await analyzeWithGemini(message, contextString);
        }
        console.log(`[ChatController] Mode: ${analysis.mode}`, { foods: analysis.foodNames, price: analysis.priceMax, veg: analysis.veg, limit: analysis.limit });

        // Save user message (non-blocking)
        if (userId) supabase.from('chat_history').insert({ user_id: userId, role: 'user', content: message, created_at: new Date().toISOString() }).then(() => {});

        // ── Step 2: Execute the correct tool ─────────────────────────────
        let type = 'text', data = [], replyMessage = '';

        switch (analysis.mode) {

            // Personalized engine only (no food filter)
            case 'recommendation': {
                let recs = await fetchFromRecommendationEngine(userId, analysis);
                if (recs.length < analysis.limit) {
                    // Fallback to high-rated DB items if engine returns little
                    const db = await fetchFromDB({ ...analysis, foodNames: [] });
                    recs = mergeResults(recs, db, analysis.limit);
                }
                data = recs;
                type = 'search_food';
                replyMessage = await buildMessage(message, analysis, data.length);
                break;
            }

            // Rec engine → filter by food name → fill from DB if short
            case 'filtered_rec': {
                let recs = await fetchFromRecommendationEngine(userId, { ...analysis, limit: 80 });
                let filtered = applyFilters(recs, analysis);

                if (filtered.length < analysis.limit) {
                    // Not enough from recommendations — supplement with DB
                    const db = await fetchFromDB(analysis);
                    filtered = mergeResults(filtered, db, analysis.limit);
                }
                data = filtered;
                type = 'search_food';
                replyMessage = await buildMessage(message, analysis, data.length);
                break;
            }

            // DB first (explicit search): "show biryani", "find pizza"
            case 'db_search': {
                data = await fetchFromDB(analysis);
                type = 'search_food';
                replyMessage = await buildMessage(message, analysis, data.length);
                break;
            }

            // Hybrid: rec engine filtered + DB merged
            case 'hybrid': {
                data = await fetchHybrid(userId, analysis);
                type = 'search_food';
                replyMessage = await buildMessage(message, analysis, data.length);
                break;
            }

            case 'restaurant_search': {
                data = await fetchRestaurants(analysis);
                type = 'search_restaurant';
                replyMessage = data.length > 0
                    ? `Found ${data.length} restaurants for you! 🏪`
                    : "No restaurants found. Try a broader search!";
                break;
            }

            case 'order_history': {
                data = await fetchOrders(userId);
                type = 'get_orders';
                replyMessage = data.length > 0
                    ? `Here are your last ${data.length} orders! 📦`
                    : "I couldn't find any recent orders for your account.";
                break;
            }

            default: {
                replyMessage = await generateConversationalReply(message);
                type = 'text';
                break;
            }
        }

        // Save bot reply (non-blocking)
        if (userId) supabase.from('chat_history').insert({ user_id: userId, role: 'assistant', content: replyMessage, created_at: new Date().toISOString() }).then(() => {});

        return res.json({
            type,
            message: replyMessage,
            ...(data.length > 0 ? { data } : {})
        });

    } catch (error) {
        console.error('[ChatController] Error:', error.stack || error.message);
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
        const { data } = await supabase.from('chat_history').select('*')
            .eq('user_id', userId).order('created_at', { ascending: true }).limit(200);
        return res.json(data || []);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
