process.env.SUPABASE_URL = "https://xyz.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "dummy";

const { getRecommendations } = require('./services/recommendationEngine');

(async () => {
    try {
        await getRecommendations('testuser');
        console.log("No error thrown!");
    } catch (e) {
        console.error("CAUGHT THE BUG:", e.stack);
    }
})();
