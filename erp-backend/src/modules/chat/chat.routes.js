const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');

const {
  listUsers,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  deleteMessage
} = require('./chat.controller');

router.get('/users', protect, listUsers);

router.get('/conversations', protect, listConversations);

router.get('/messages/:userId', protect, getMessages);

router.post('/messages/:userId', protect, sendMessage);

router.put('/read/:userId', protect, markRead);

router.delete('/messages/:messageId', protect, deleteMessage);

module.exports = router;


