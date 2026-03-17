/**
 * recommendationRoutes.js
 * REST API routes for the recommendation system.
 *
 * GET  /api/recommendations/:userId                       — personalized recs
 * GET  /api/recommendations/location/:userId/:location    — location-overridden recs
 * GET  /api/recommendations/similar/:foodId               — similar food suggestions
 * POST /api/recommendations/track                         — event tracking
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/recommendationController');

// ── IMPORTANT: static routes BEFORE dynamic :param routes ──
router.get('/similar/:foodId',              ctrl.getSimilarFoodRecommendations);
router.get('/location/:userId/:location',   ctrl.getLocationBasedRecommendations);
router.get('/:userId',                      ctrl.getPersonalizedRecommendations);
router.post('/track',                       ctrl.trackUserActivity);

module.exports = router;
