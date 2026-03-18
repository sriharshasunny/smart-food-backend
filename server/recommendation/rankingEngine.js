/**
 * Calculates a final score for each food item relative to the user's preferences.
 * Score = Cuisine match * weight + Behavior score + Rating + Distance score + Price match + Diversity score.
 */
class RankingEngine {
    constructor() {
        this.weights = {
            categoryMatch: 15,
            vegMatch: 10,
            ratingMultiplier: 2,
            popularityMultiplier: 0.5 // Assuming we have an order_count property
        };
    }

    /**
     * Calculates score for a single food item against a user profile.
     */
    calculateScore(food, userProfile, locationContext = null) {
        let score = 0;

        // 1. Base Score: Restaurant & Food Rating
        if (food.rating) score += (food.rating * this.weights.ratingMultiplier);
        if (food.restaurant?.rating) score += (food.restaurant.rating * 1.5);

        // 2. Behavioral Match (Category/Cuisine)
        if (userProfile?.category_scores && food.category) {
            const catScore = userProfile.category_scores[food.category] || 0;
            // Cap category behavioral boost so highly rated items can still compete
            score += Math.min(catScore, this.weights.categoryMatch); 
        }

        // 3. Behavioral Match (Veg/Non-Veg)
        if (userProfile?.veg_score !== undefined && typeof food.is_veg === 'boolean') {
            // If veg_score > 0 user prefers veg. If veg_score < 0 user prefers non-veg.
            if (userProfile.veg_score > 5 && food.is_veg) score += this.weights.vegMatch;
            if (userProfile.veg_score < -5 && !food.is_veg) score += this.weights.vegMatch;
        }

        // 4. Popularity (if order_count was tracked in DB)
        if (food.order_count) {
            score += (food.order_count * this.weights.popularityMultiplier);
        }

        // 5. Explicit Context Match (Location / Price)
        if (locationContext?.maxPrice && food.price <= locationContext.maxPrice) {
            score += 5; // Bonus for fitting budget perfectly
        }

        return score;
    }

    /**
     * Sorts an array of foods based on their computed scores.
     */
    rankFoods(foods, userProfile, locationContext = null) {
        const scored = foods.map(food => {
            return {
                ...food,
                _score: this.calculateScore(food, userProfile, locationContext)
            };
        });

        // Sort descending by score
        return scored.sort((a, b) => b._score - a._score);
    }
}

module.exports = new RankingEngine();
