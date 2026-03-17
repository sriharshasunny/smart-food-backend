/**
 * geminiExplainer.js
 * Generates personalized recommendation explanation text using Gemini API.
 * Falls back to template strings on timeout or API error.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
function getGenAI() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

const MODEL_NAME = 'gemini-1.5-flash';
const TIMEOUT_MS = 6000;

/**
 * Build the prompt for Gemini based on user preferences and top food.
 * @param {Object|null} prefs  — user_preferences row
 * @param {Object} topFoods    — first few recommended foods
 * @param {string} strategy    — 'personalized' | 'cold_start' | 'trending' | 'location'
 */
function buildPrompt(prefs, topFoods, strategy) {
  if (strategy === 'cold_start' || !prefs) {
    const foodNames = topFoods.slice(0, 3).map(f => f.name).join(', ');
    return `You are a friendly food recommendation assistant for a food delivery app.
Write a single warm, engaging sentence (max 30 words) explaining why these trending foods are recommended to a new user: ${foodNames}.
Be specific about why these foods are popular right now. Do not use hashtags or emojis.`;
  }

  // Build preference summary
  const topCuisines = Object.entries(prefs.cuisine_scores || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([c]) => c);

  const vegPref = prefs.veg_preference === 'veg'
    ? 'prefers vegetarian food'
    : prefs.veg_preference === 'non_veg'
    ? 'enjoys non-vegetarian dishes'
    : '';

  const spice = prefs.avg_spice_level >= 4 ? 'loves spicy food'
    : prefs.avg_spice_level <= 2 ? 'prefers mild food'
    : 'enjoys moderately spiced dishes';

  const foodNames = topFoods.slice(0, 3).map(f => f.name).join(', ');
  const cuisineStr = topCuisines.length > 0 ? `loves ${topCuisines.join(' and ')} cuisine` : '';

  return `You are a friendly food recommendation assistant for a food delivery app.
User profile: ${[cuisineStr, vegPref, spice].filter(Boolean).join(', ')}.
Write a single personalized, warm sentence (max 35 words) explaining why these foods are recommended: ${foodNames}.
Be specific and mention the user's taste. Do not use hashtags or emojis.`;
}

/**
 * generateExplanation — main Gemini call with timeout + fallback.
 * @param {Object|null} prefs
 * @param {Array} topFoods
 * @param {string} strategy
 * @returns {Promise<string>}
 */
async function generateExplanation(prefs, topFoods = [], strategy = 'personalized') {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[GeminiExplainer] GEMINI_API_KEY not set — using fallback');
    return buildFallback(prefs, topFoods, strategy);
  }

  const prompt = buildPrompt(prefs, topFoods, strategy);

  try {
    const result = await Promise.race([
      callGemini(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch (err) {
    console.warn('[GeminiExplainer] API error or timeout:', err.message);
    return buildFallback(prefs, topFoods, strategy);
  }
}

async function callGemini(prompt) {
  const model = getGenAI().getGenerativeModel({ model: MODEL_NAME });
  const res = await model.generateContent(prompt);
  return res.response.text().trim();
}

/**
 * Template fallback explanation.
 */
function buildFallback(prefs, topFoods, strategy) {
  if (strategy === 'cold_start' || !prefs) {
    return "Here are the most popular and highly-rated foods trending right now in your area!";
  }

  const topCuisines = Object.entries(prefs.cuisine_scores || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([c]) => c);

  if (topCuisines.length > 0) {
    return `Because you love ${topCuisines.join(' and ')} cuisine, we've handpicked these top-rated dishes just for you.`;
  }

  if (prefs.veg_preference === 'veg') {
    return "Based on your taste for vegetarian food, here are our best picks for you today.";
  }

  return "Based on your ordering history, here are foods we think you'll absolutely love!";
}

module.exports = { generateExplanation };
