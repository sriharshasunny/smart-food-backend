/**
 * recommendationController.js
 * Handles all recommendation HTTP requests — parses params,
 * delegates to service layer, returns standardized responses.
 */

const { getRecommendations, getLocationRecommendations } = require('../services/recommendationEngine');
const { getSimilarFoods }  = require('../services/locationEngine');
const { trackActivity }    = require('../services/preferenceEngine');
const cache                = require('../utils/cache');

/**
 * GET /api/recommendations/:userId
 * Query params: city, lat, lng, limit, page
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const {
      city = null,
      lat = null,
      lng = null,
      limit = 20,
      page = 1,
    } = req.query;

    const userCoords = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

    const result = await getRecommendations(userId, {
      city,
      userCoords,
      limit: Math.min(parseInt(limit) || 20, 50),
      page: parseInt(page) || 1,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[RecController] getPersonalizedRecommendations error:', err.message);
    return res.status(500).json({ error: 'Failed to generate recommendations', details: err.message });
  }
};

/**
 * GET /api/recommendations/location/:userId/:location
 * :location is a city name (URL-encoded)
 */
exports.getLocationBasedRecommendations = async (req, res) => {
  try {
    const { userId, location } = req.params;
    if (!userId || !location) {
      return res.status(400).json({ error: 'userId and location are required' });
    }

    const { lat, lng, limit = 20, page = 1 } = req.query;
    const userCoords = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

    const city = decodeURIComponent(location);

    const result = await getLocationRecommendations(userId, city, {
      userCoords,
      limit: Math.min(parseInt(limit) || 20, 50),
      page: parseInt(page) || 1,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[RecController] getLocationBasedRecommendations error:', err.message);
    return res.status(500).json({ error: 'Failed to generate location recommendations', details: err.message });
  }
};

/**
 * GET /api/recommendations/similar/:foodId
 */
exports.getSimilarFoodRecommendations = async (req, res) => {
  try {
    const { foodId } = req.params;
    if (!foodId) return res.status(400).json({ error: 'foodId is required' });

    const similar = await getSimilarFoods(foodId);

    return res.json({
      success: true,
      foodId,
      recommendations: similar,
      count: similar.length,
    });
  } catch (err) {
    console.error('[RecController] getSimilarFoodRecommendations error:', err.message);
    return res.status(500).json({ error: 'Failed to find similar foods', details: err.message });
  }
};

/**
 * POST /api/recommendations/track
 * Body: { userId, action, foodId?, restaurantId?, metadata? }
 */
exports.trackUserActivity = async (req, res) => {
  try {
    const { userId, action, foodId, restaurantId, metadata = {} } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'userId and action are required' });
    }

    const validActions = ['view', 'click', 'cart', 'order', 'wishlist', 'rate'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }

    const success = await trackActivity(userId, action, foodId || null, restaurantId || null, metadata);

    // Invalidate recommendation cache for this user
    cache.invalidatePrefix(`rec:${userId}`);

    return res.json({ success });
  } catch (err) {
    console.error('[RecController] trackUserActivity error:', err.message);
    return res.status(500).json({ error: 'Failed to track activity', details: err.message });
  }
};
