require('dotenv').config();
const { processChatRequest } = require('../controllers/chatController');

// Mock req and res
const req = {
    body: {
        message: "I want to reorder what I got last time. Are those items available?",
        userId: "d8e3d0cd-f2d1-432d-88b1-12f38d390a37", // A valid user ID format, though might need a real one from DB
        history: [
            { sender: 'user', content: 'What is near me?' },
            { sender: 'ai', content: 'I found these restaurants nearby!' }
        ]
    }
};

const res = {
    json: (data) => console.log("\n✅ Response JSON:", JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log("Status Code:", code);
        return {
            json: (data) => console.log("Response JSON:", JSON.stringify(data, null, 2))
        };
    }
};

async function run() {
    console.log("Testing Advanced Chat...");
    await processChatRequest(req, res);
    console.log("Done.");
    process.exit(0);
}

run();
