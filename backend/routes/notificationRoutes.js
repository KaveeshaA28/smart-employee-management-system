/**
 * Notification Routes
 * GET  /api/notifications           → All (role-filtered)
 * POST /api/notifications/send-email → Admin only
 */

const express = require('express');
const router = express.Router();
const { getNotifications, sendManualEmail } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.post('/send-email', authorize('Admin'), sendManualEmail);

module.exports = router;
