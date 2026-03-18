const supabase = require('../utils/supabase');

/**
 * Ensures items are not duplicated by finding similar alternatives.
 */
class SimilarityEngine {
    
    /**
     * Replaces an already-recommended food with a similar alternative.
     * Uses same cuisine/category, similar price range, or nearby restaurant.
     */
    async findAlternative(originalFood, excludeIds = []) {
        try {
            let query = supabase.from('foods').select('*, restaurant:restaurants!inner(*)')
                .eq('available', true)
                .eq('restaurant.is_active', true)
                .not('id', 'in', `(${excludeIds.join(',')})`); // Exclude shown items

            // Similarity logic: Same category
            if (originalFood.category) {
                query = query.eq('category', originalFood.category);
            }

            // Same veg preference
            if (typeof originalFood.is_veg === 'boolean') {
                query = query.eq('is_veg', originalFood.is_veg);
            }

            // Similarity logic: Similar price range (+/- 20%)
            if (originalFood.price) {
                query = query.gte('price', originalFood.price * 0.8)
                             .lte('price', originalFood.price * 1.2);
            }

            // Fallback alternative fetching
            const { data, error } = await query.order('rating', { ascending: false, nullsLast: true }).limit(5);

            if (!error && data && data.length > 0) {
                // Return a random alternative from the top 5 to ensure variety
                return data[Math.floor(Math.random() * data.length)];
            }
            return null;

        } catch (error) {
            console.error('[SimilarityEngine] Alternative fetch failed:', error.message);
            return null;
        }
    }

    /**
     * Takes an array of candidate foods and deduplicates them against session history.
     */
    async deduplicate(candidateFoods, sessionHistoryIds = []) {
        const uniqueSet = new Set(sessionHistoryIds);
        const finalResults = [];

        for (const food of candidateFoods) {
            if (uniqueSet.has(food.id)) {
                // If already shown recently, find a diverse alternative
                const alternative = await this.findAlternative(food, Array.from(uniqueSet));
                if (alternative) {
                    finalResults.push(alternative);
                    uniqueSet.add(alternative.id);
                }
            } else {
                finalResults.push(food);
                uniqueSet.add(food.id);
            }
        }

        return { deduped: finalResults, allSeenIds: Array.from(uniqueSet) };
    }
}

module.exports = new SimilarityEngine();
