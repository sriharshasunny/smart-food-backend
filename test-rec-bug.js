// Error hunting script
const { getRecommendations } = require('./server/services/recommendationEngine');

// Mock process.env to avoid the missing Supabase URL error, but capture the underlying engine error
process.env.SUPABASE_URL = "https://xyz.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "dummy";

(async () => {
    try {
        await getRecommendations('testuser');
        console.log("No error thrown!");
    } catch (e) {
        console.error("CAUGHT THE BUG:", e.stack);
    }
})();
