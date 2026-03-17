/**
 * locationEngine.js
 * Fetches restaurants and food items available in a given location/city,
 * with a 10-minute per-city result cache to avoid hammering Supabase.
 */

const supabase = require('../utils/supabase');
const cache = require('../utils/cache');

const LOCATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * getFoodsInCity — returns all available foods from active restaurants in a city.
 * Each food object includes a nested `restaurant` object for distance / price-tier use.
 *
 * @param {string} city     — e.g. "Hyderabad"
 * @param {Object} options  — { limit: number (default 200) }
 * @returns {Array}
 */
async function getFoodsInCity(city, options = {}) {
  if (!city) {
    // Fallback: return all foods across all active restaurants
    return getAllActiveFoods(options);
  }

  const normalizedCity = city.trim().toLowerCase();
  const cacheKey = `foods_city:${normalizedCity}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { limit = 300 } = options;

  // Fetch available foods from restaurants in this city
  const { data: foods, error } = await supabase
    .from('foods')
    .select(`
      id,
      name,
      price,
      image,
      description,
      category,
      cuisine,
      is_veg,
      spice_level,
      meal_type,
      rating,
      popularity_score,
      order_count,
      available,
      restaurant_id,
      restaurants!inner (
        id,
        name,
        city,
        location,
        latitude,
        longitude,
        rating,
        cuisine_tags,
        price_tier,
        popularity_score,
        is_active
      )
    `)
    .eq('available', true)
    .eq('restaurants.is_active', true)
    .ilike('restaurants.city', `%${normalizedCity}%`)
    .limit(limit);

  if (error) {
    console.error('[LocationEngine] City foods fetch error:', error.message);
    return getAllActiveFoods(options); // fallback
  }

  // Flatten: attach restaurant object directly on food
  const enriched = (foods || []).map(f => ({
    ...f,
    restaurant: f.restaurants,
  }));

  cache.set(cacheKey, enriched, LOCATION_CACHE_TTL);
  return enriched;
}

/**
 * getAllActiveFoods — fallback when no city is available.
 * @param {Object} options
 */
async function getAllActiveFoods(options = {}) {
  const { limit = 200 } = options;
  const cacheKey = 'foods_all_active';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data: foods, error } = await supabase
    .from('foods')
    .select(`
      id, name, price, image, description, category, cuisine,
      is_veg, spice_level, meal_type, rating, popularity_score,
      order_count, available, restaurant_id,
      restaurants!inner (
        id, name, city, location, latitude, longitude,
        rating, cuisine_tags, price_tier, popularity_score, is_active
      )
    `)
    .eq('available', true)
    .eq('restaurants.is_active', true)
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[LocationEngine] All foods fetch error:', error.message);
    return [];
  }

  const enriched = (foods || []).map(f => ({
    ...f,
    restaurant: f.restaurants,
  }));

  cache.set(cacheKey, enriched, LOCATION_CACHE_TTL);
  return enriched;
}

/**
 * getSimilarFoods — foods with same cuisine, same category, price within ±40%.
 * @param {string} foodId
 * @returns {Array}
 */
async function getSimilarFoods(foodId) {
  const cacheKey = `similar:${foodId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // First, get the target food
  const { data: target, error: targetErr } = await supabase
    .from('foods')
    .select('id, cuisine, category, price, is_veg, restaurant_id')
    .eq('id', foodId)
    .single();

  if (targetErr || !target) {
    console.error('[LocationEngine] Target food not found:', targetErr?.message);
    return [];
  }

  const priceMin = target.price * 0.6;
  const priceMax = target.price * 1.4;

  let query = supabase
    .from('foods')
    .select(`
      id, name, price, image, description, category, cuisine,
      is_veg, spice_level, meal_type, rating, popularity_score, available,
      restaurant_id,
      restaurants!inner ( id, name, city, rating, is_active )
    `)
    .neq('id', foodId)
    .eq('available', true)
    .eq('restaurants.is_active', true)
    .gte('price', priceMin)
    .lte('price', priceMax)
    .order('rating', { ascending: false })
    .limit(20);

  // Filter by cuisine OR category (OR is not directly available, so handle in JS)
  const { data: candidates, error: candErr } = await query;
  if (candErr) {
    console.error('[LocationEngine] Similar foods error:', candErr.message);
    return [];
  }

  // Score by similarity: same cuisine (3pts) + same category (2pts) + same veg type (1pt)
  const scored = (candidates || [])
    .map(f => {
      let sim = 0;
      if (f.cuisine && target.cuisine && f.cuisine.toLowerCase() === target.cuisine.toLowerCase()) sim += 3;
      if (f.category && target.category && f.category.toLowerCase() === target.category.toLowerCase()) sim += 2;
      if (f.is_veg === target.is_veg) sim += 1;
      return { ...f, restaurant: f.restaurants, _similarity: sim };
    })
    .filter(f => f._similarity >= 2)        // at least one dimension matches
    .sort((a, b) => b._similarity - a._similarity || b.rating - a.rating)
    .slice(0, 12);

  cache.set(cacheKey, scored, 15 * 60 * 1000); // 15 min
  return scored;
}

module.exports = { getFoodsInCity, getAllActiveFoods, getSimilarFoods };
