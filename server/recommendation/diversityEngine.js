/**
 * Enforces a diversified mix of recommendations to prevent filter bubbles.
 * Target: 70% personalized preference matches, 30% exploration/trending items.
 */
class DiversityEngine {
    
    /**
     * Shuffles an array randomly.
     */
    shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    /**
     * Mixes personalized foods and exploratory foods.
     * @param {Array} personalizedFoods - Foods matching user habits (already ranked)
     * @param {Array} trendingFoods - Foods that are globally popular or highly rated
     * @param {number} totalLimit - Max elements to return (e.g., 10)
     */
    enforceDiversity(personalizedFoods, trendingFoods, totalLimit = 10) {
        // If entirely a cold start (no personalized foods), return trending
        if (!personalizedFoods || personalizedFoods.length === 0) {
            return trendingFoods.slice(0, totalLimit);
        }

        const preferenceTarget = Math.ceil(totalLimit * 0.7); // 70%
        const explorationTarget = totalLimit - preferenceTarget; // 30%

        // Take top personalized items
        const selectedPersonalized = personalizedFoods.slice(0, preferenceTarget);
        
        // Remove items from trending that are already in personalized to avoid duplicates
        const selectedIds = new Set(selectedPersonalized.map(f => f.id));
        const filteredTrending = trendingFoods.filter(f => !selectedIds.has(f.id));

        // Take top exploration items
        const selectedExploration = filteredTrending.slice(0, explorationTarget);

        const mixedResults = [...selectedPersonalized, ...selectedExploration];

        // Shuffle slightly so the "exploration" items aren't always clumped at the very end
        // However, keep top 1 or 2 personalized items at the very top for relevance
        if (mixedResults.length > 3) {
            const topKeepers = mixedResults.slice(0, 2);
            const rest = this.shuffle(mixedResults.slice(2));
            return [...topKeepers, ...rest].slice(0, totalLimit);
        }

        return mixedResults.slice(0, totalLimit);
    }
}

module.exports = new DiversityEngine();
