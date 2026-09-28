const express = require('express');
const router = express.Router();
const {
  getConversation,
  sendMessage,
  getConversations,
  getUnreadCount,
  getClientConversation
} = require('../controllers/chatController');
const { protect, protectClient } = require('../middleware/auth');

router.get('/conversation', protect, getConversation);
router.get('/client/conversation', protectClient, getClientConversation);
router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.post('/messages', protect, sendMessage);

module.exports = router;