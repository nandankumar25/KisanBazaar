const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationMessages,
  getOrCreateConversationWithUser,
  getUnreadMessageCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationMessages);
router.get('/with/:otherUserId', getOrCreateConversationWithUser);
router.get('/unread-count', getUnreadMessageCount);

module.exports = router;
