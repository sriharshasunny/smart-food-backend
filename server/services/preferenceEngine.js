/**
 * preferenceEngine.js
 * Learns and maintains user taste vectors from activity history.
 * Implements exponential time-decay so recent behaviour is weighted higher.
 */

const supabase = require('../utils/supabase');
const cache = require('../utils/cache');

// Action weights — how much each interaction type contributes to preference score
const ACTION_WEIGHTS = {
  order:    10,
  cart:      5,
  wishlist:  3,
  click:     2,
  view:      1,
  rate:      8,
};

// Time-decay half-life in days (score halves every N days)
const HALF_LIFE_DAYS = 14;

/**
 * Compute a time-decayed weight for an activity entry.
 * @param {number} baseWeight
 * @param {Date|string} createdAt
 */
function decayedWeight(baseWeight, createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  return baseWeight * decayFactor;
}

/**
 * computeUserPreferences — reads recent activity and builds a preference vector.
 * @param {string} userId
 * @returns {Object} preference object
 */
async function computeUserPreferences(userId) {
  // Fetch last 90 days of activity with food metadata
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: activities, error } = await supabase
    .from('user_activity')
    .select(`
      action_type,
      action_weight,
      created_at,
      metadata,
      food_id,
      restaurant_id
    `)
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[PreferenceEngine] Activity fetch error:', error.message);
    return null;
  }

  if (!activities || activities.length === 0) {
    return null; // Cold start — no history
  }

  // Aggregate scores
  const cuisineScores = {};
  const categoryScores = {};
  const mealTypeScores = {};
  const restaurantScores = {};
  const prices = [];
  let vegCount = 0;
  let nonVegCount = 0;
  let totalSpice = 0;
  let spiceCount = 0;
  let totalInteractions = activities.length;

  for (const activity of activities) {
    const weight = decayedWeight(
      ACTION_WEIGHTS[activity.action_type] || activity.action_weight || 1,
      activity.created_at
    );

    const meta = activity.metadata || {};

    // Cuisine scoring
    if (meta.cuisine) {
      cuisineScores[meta.cuisine] = (cuisineScores[meta.cuisine] || 0) + weight;
    }

    // Category scoring
    if (meta.category) {
      categoryScores[meta.category] = (categoryScores[meta.category] || 0) + weight;
    }

    // Meal type scoring
    if (meta.meal_type) {
      mealTypeScores[meta.meal_type] = (mealTypeScores[meta.meal_type] || 0) + weight;
    }

    // Price tracking (for orders / cart only)
    if (meta.price && (activity.action_type === 'order' || activity.action_type === 'cart')) {
      prices.push(Number(meta.price));
    }

    // Veg preference
    if (meta.is_veg !== undefined) {
      if (meta.is_veg) vegCount++;
      else nonVegCount++;
    }

    // Spice level
    if (meta.spice_level) {
      totalSpice += Number(meta.spice_level) * weight;
      spiceCount += weight;
    }

    // Restaurant scoring (for orders)
    if (activity.restaurant_id && (activity.action_type === 'order' || activity.action_type === 'cart')) {
      restaurantScores[activity.restaurant_id] = (restaurantScores[activity.restaurant_id] || 0) + weight;
    }
  }

  // Derive aggregates
  const sortedPrices = prices.sort((a, b) => a - b);
  const priceMin = sortedPrices.length > 0 ? sortedPrices[0] : 0;
  const priceMax = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 9999;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  const vegPref = vegCount === 0 && nonVegCount === 0
    ? 'any'
    : vegCount > nonVegCount * 2
    ? 'veg'
    : nonVegCount > vegCount * 2
    ? 'non_veg'
    : 'any';

  const avgSpice = spiceCount > 0 ? totalSpice / spiceCount : 2.5;

  // Top 5 restaurants by score
  const topRestaurants = Object.entries(restaurantScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return {
    user_id: userId,
    cuisine_scores: cuisineScores,
    category_scores: categoryScores,
    meal_type_scores: mealTypeScores,
    avg_order_price: avgPrice,
    price_min: priceMin,
    price_max: priceMax,
    veg_preference: vegPref,
    avg_spice_level: Number(avgSpice.toFixed(2)),
    top_restaurants: topRestaurants,
    total_interactions: totalInteractions,
    last_computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * upsertUserPreferences — compute and persist preference vector.
 * @param {string} userId
 * @returns {Object|null}
 */
async function upsertUserPreferences(userId) {
  const prefs = await computeUserPreferences(userId);
  if (!prefs) return null;

  const { error } = await supabase
    .from('user_preferences')
    .upsert(prefs, { onConflict: 'user_id' });

  if (error) {
    console.error('[PreferenceEngine] Upsert error:', error.message);
    return null;
  }

  // Bust cache so next recommendation call gets fresh prefs
  cache.invalidate(`prefs:${userId}`);
  console.log(`[PreferenceEngine] Updated preferences for user ${userId}`);
  return prefs;
}

/**
 * getUserPreferences — load from DB (with cache, TTL 10 min).
 * @param {string} userId
 * @returns {Object|null}
 */
async function getUserPreferences(userId) {
  const cacheKey = `prefs:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  cache.set(cacheKey, data, 10 * 60 * 1000);
  return data;
}

/**
 * trackActivity — record a user interaction and trigger async preference update.
 * @param {string} userId
 * @param {string} actionType
 * @param {string|null} foodId
 * @param {string|null} restaurantId
 * @param {Object} meta  — { price, cuisine, category, spice_level, is_veg, meal_type }
 */
async function trackActivity(userId, actionType, foodId = null, restaurantId = null, meta = {}) {
  const weight = ACTION_WEIGHTS[actionType] || 1;

  const { error } = await supabase.from('user_activity').insert({
    user_id: userId,
    food_id: foodId || null,
    restaurant_id: restaurantId || null,
    action_type: actionType,
    action_weight: weight,
    metadata: meta,
  });

  if (error) {
    console.error('[PreferenceEngine] Track activity error:', error.message);
    return false;
  }

  // Debounced async preference re-compute (every 5 interactions)
  // Fire and forget — don't await in the hot path
  const countKey = `track_count:${userId}`;
  const count = (cache.get(countKey) || 0) + 1;
  cache.set(countKey, count, 30 * 60 * 1000); // 30-min window

  if (count % 5 === 0) {
    setImmediate(() => upsertUserPreferences(userId));
  }

  return true;
}

module.exports = {
  trackActivity,
  getUserPreferences,
  upsertUserPreferences,
  computeUserPreferences,
  ACTION_WEIGHTS,
};
