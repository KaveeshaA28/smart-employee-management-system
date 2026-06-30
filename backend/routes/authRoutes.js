const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, updateProfile, changePassword, uploadAvatar,
  forgotPassword, resetPassword, sendVerification, verifyEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAvatar: multerAvatar, handleUploadError } = require('../middleware/uploadMiddleware');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Admin registration route
router.post('/register-admin', protect, authorize('Admin'), register);

// Protected routes
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);
router.post('/avatar', multerAvatar.single('avatar'), handleUploadError, uploadAvatar);
router.post('/send-verification', sendVerification);

module.exports = router;