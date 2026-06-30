/**
 * Auth Routes
 * POST   /api/auth/register         → Admin only
 * POST   /api/auth/login            → Public
 * POST   /api/auth/logout           → Protected
 * GET    /api/auth/me               → Protected
 * PUT    /api/auth/me               → Protected
 * PUT    /api/auth/change-password  → Protected
 * POST   /api/auth/avatar           → Protected
 */

const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile, changePassword, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAvatar: multerAvatar, handleUploadError } = require('../middleware/uploadMiddleware');

// Public routes
router.post('/login', login);
router.post('/register', register); // public registration for employees

// Admin registration route for role-based user creation
router.post('/register-admin', protect, authorize('Admin'), register);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateProfile);
router.put('/change-password', changePassword);
router.post('/avatar', multerAvatar.single('avatar'), handleUploadError, uploadAvatar);

module.exports = router;
