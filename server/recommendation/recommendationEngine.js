const supabase = require('../utils/supabase');
const behaviorEngine = require('./behaviorEngine');
const similarityEngine = require('./similarityEngine');
const diversityEngine = require('./diversityEngine');
const rankingEngine = require('./rankingEngine');

/**
 * Orchestrates all recommendation logical steps:
 * 1. Fetch raw candidates
 * 2. Fetch User Profile
 * 3. Rank via Preferences
 * 4. Deduplicate actively shown items
 * 5. Ensure 70/30 Diversity mix.
 */
class RecommendationEngine {
    
    /**
     * Get tailored recommendations for a user.
     */
    async getRecommendations(userId, limit = 10, filters = {}) {
        try {
            // 1. Fetch User Profile & Preferences
            const userProfile = await behaviorEngine.getUserProfile(userId);

            // 2. Fetch base foods (Trending + New)
            // Filter by active restaurants
            let query = supabase.from('foods').select('*, restaurant:restaurants!inner(*)')
                .eq('available', true)
                .eq('restaurant.is_active', true);

            // Fetch an initial large pool to rank and filter down (e.g. 50 items)
            const { data: rawCandidates, error } = await query.limit(50);
            if (error || !rawCandidates) return [];

            // 3. Score and Rank candidates against user preferences
            const rankedCandidates = rankingEngine.rankFoods(rawCandidates, userProfile, {
                maxPrice: filters.price_max
            });

            // 4. Extract recently seen history to deduplicate
            const sessionHistoryIds = await this.getRecentRecommendations(userId);
            
            // 5. Similarity Deduplication (returns clean array and seen set)
            // We pass top 20 for deductions
            const { deduped } = await similarityEngine.deduplicate(rankedCandidates.slice(0, 20), sessionHistoryIds);

            // 6. Enforce Diversity (70% preferred base, 30% exploration/trending)
            // Deduped represents personalized high-scoring. Let's slice out true trending from raw.
            const genericTrending = rawCandidates.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 15);
            
            const finalMix = diversityEngine.enforceDiversity(deduped, genericTrending, limit);

            // 7. Save to Recommendation History asynchronously to prevent duplicate next query
            this.logRecommendations(userId, finalMix.map(f => f.id));

            return finalMix;

        } catch (error) {
            console.error('[RecommendationEngine] Failed:', error.message);
            return [];
        }
    }

    /**
     * Best-effort save to history cache.
     */
    async logRecommendations(userId, foodIds) {
        if (!userId || foodIds.length === 0) return;
        try {
            await supabase.from('recommendation_history').insert(
                foodIds.map(id => ({ user_id: userId, food_id: id, created_at: new Date().toISOString() }))
            );
        } catch(e) { /* ignore */ }
    }

    /**
     * Retrieves recent foods the user was shown to avoid repetition.
     */
    async getRecentRecommendations(userId) {
        if (!userId) return [];
        try {
            const { data } = await supabase.from('recommendation_history')
                .select('food_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);
            return (data || []).map(r => r.food_id);
        } catch(e) {
            return [];
        }
    }
}

module.exports = new RecommendationEngine();
