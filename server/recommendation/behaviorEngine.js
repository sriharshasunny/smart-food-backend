const supabase = require('../utils/supabase');

/**
 * Tracks and computes user behavioral scores (Views, Clicks, Cart Adds, Orders)
 * view = 1, click = 2, cart = 4, order = 8, repeat order = 12
 */
class BehaviorEngine {
    constructor() {
        this.weights = {
            view: 1,
            click: 2,
            cart: 4,
            order: 8,
            repeat_order: 12
        };
    }

    /**
     * Logs a user action and updates their preference score asynchronously.
     */
    async logAction(userId, foodId, actionType, meta = {}) {
        if (!userId || !foodId || !this.weights[actionType]) return;

        try {
            // Log to activity table (best effort)
            await supabase.from('user_activity').insert({
                user_id: userId,
                food_id: foodId,
                action_type: actionType,
                weight: this.weights[actionType],
                meta: meta
            });

            // Recompute or incrementally update user preferences
            await this.updatePreferences(userId, foodId, actionType);
        } catch (error) {
            console.error('[BehaviorEngine] Logging error:', error.message);
        }
    }

    /**
     * Updates the user's cuisine or food category preference profile.
     */
    async updatePreferences(userId, foodId, actionType) {
        try {
            // 1. Fetch food details
            const { data: food } = await supabase.from('foods').select('category, is_veg, price').eq('id', foodId).single();
            if (!food) return;

            // 2. Fetch existing preferences
            const { data: prefs } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
            
            let categoryScores = prefs?.category_scores || {};
            categoryScores[food.category] = (categoryScores[food.category] || 0) + this.weights[actionType];

            let vegScore = prefs?.veg_score || 0;
            vegScore += food.is_veg ? this.weights[actionType] : -(this.weights[actionType] / 2); // Penalize non-veg slightly if they buy veg, etc.

            if (prefs) {
                await supabase.from('user_preferences').update({
                    category_scores: categoryScores,
                    veg_score: vegScore,
                    updated_at: new Date().toISOString()
                }).eq('user_id', userId);
            } else {
                await supabase.from('user_preferences').insert({
                    user_id: userId,
                    category_scores: categoryScores,
                    veg_score: vegScore
                });
            }
        } catch (error) {
            console.error('[BehaviorEngine] Preferences update error:', error.message);
        }
    }

    /**
     * Retrieves the user's preference profile.
     */
    async getUserProfile(userId) {
        if (!userId) return null;
        try {
            const { data } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
            return data;
        } catch (err) {
            return null;
        }
    }
}

module.exports = new BehaviorEngine();
