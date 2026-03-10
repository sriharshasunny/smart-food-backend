const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.processChatRequest);
router.get('/history', chatController.getChatHistory);

module.exports = router;

