const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Service to classify user intent.
 */
class IntentService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                generationConfig: { responseMimeType: 'application/json' }
            });
        }
    }

    // Fast-path intent detection without API calls
    detectLocalIntent(message) {
        const m = message.toLowerCase();
        if (/trending|popular|top rated|best rated|what.?s hot/i.test(m)) return 'recommend_food';
        if (/\b(?:cart|add to cart|order this|buy)\b/i.test(m)) return 'add_to_cart';
        if (/\b(?:track|where is my order|order status)\b/i.test(m)) return 'track_order';
        if (/\b(?:my orders|history|past orders)\b/i.test(m)) return 'order_history';
        if (/restaurant.*near|top restaurants|best restaurants/i.test(m)) return 'restaurant_info';
        return null;
    }

    /**
     * Detects intent using Gemini with context awareness.
     * Supported intents: recommend_food, search_food, restaurant_search, restaurant_foods, order_history, add_to_cart, remove_cart, track_order, food_question, restaurant_question, app_help, general_chat, unknown
     */
    async detectIntent(message, contextString = "") {
        if (!this.model) return { intent: this.detectLocalIntent(message) || 'general_chat' };

        const prompt = `
You are a classification layer for a food delivery app.
Classify the user's latest message into exactly ONE of these intents:
- recommend_food (asking for food recommendations)
- search_food (searching for specific foods)
- restaurant_search (searching for restaurants)
- restaurant_foods (fetching foods from a specific restaurant)
- order_history
- add_to_cart
- remove_cart
- track_order
- food_question (general questions about a food, e.g. "is this spicy?", "what is pizza?")
- restaurant_question
- app_help (asking how ordering works)
- general_chat
- unknown (completely unrelated prompt that shouldn't be answered by a food delivery bot)

If the user is completely vague (e.g., just says "food", "suggest something", "I am hungry"), you MUST set requires_clarification to true, and provide a clarification_question asking what they want.
CRITICAL: If the user states ANY specific food (e.g., "ice cream", "pizza", "biryani", "best burgers", "chicken under 500") or any specific restaurant, YOU MUST STRICTLY set requires_clarification to FALSE and clarification_question to null. Do NOT use clarification_question to say "Searching for...". 

Recent Context:
${contextString}

Latest User Message: "${message}"

Respond strictly with JSON format:
{
  "intent": "detected_intent_here",
  "requires_clarification": boolean,
  "clarification_question": "Short question here ONLY if requires_clarification is true, else null"
}
`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(text);
            return parsed; // Returns { intent, requires_clarification, clarification_question }
        } catch (error) {
            console.error('[IntentService] Gemini error:', error.message);
            return { intent: this.detectLocalIntent(message) || 'general_chat' };
        }
    }

    /**
     * Answers general questions conversationally using Gemini.
     */
    async answerQuestion(message, intentCategory) {
        if (!this.model) return "I can only help you order food right now.";
        
        const systemPrompt = `
You are a friendly, professional AI assistant for a food delivery app.
The user's intent was classified as: ${intentCategory}.
User message: "${message}"

If they are asking about how the app works, be helpful and explain ordering.
If they ask about food details (like what is pizza/is this spicy), answer informatively and naturally.
If they ask something completely unrelated (unknown), be polite and briefly answer if you know, but politely remind them you are a food app assistant.
Keep the response under 3 sentences. Be extremely natural, avoiding robotic lists.`;

        try {
            const result = await this.model.generateContent(systemPrompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('[IntentService] Generative error:', error.message);
            return "I'm having a little trouble thinking of an answer right now, but I can still help you find great food!";
        }
    }
}

module.exports = new IntentService();
