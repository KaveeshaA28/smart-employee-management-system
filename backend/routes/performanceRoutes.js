/**
 * Performance Routes
 * GET    /api/performance/stats           → All (own for Employee)
 * POST   /api/performance/auto-calculate  → Manager, Admin
 * GET    /api/performance                 → All (own for Employee)
 * GET    /api/performance/:id            → All (own for Employee)
 * POST   /api/performance               → Manager, Admin
 * PUT    /api/performance/:id           → Manager, Admin
 * PATCH  /api/performance/:id/acknowledge → Employee (own)
 */

const express = require('express');
const router = express.Router();
const {
  createReview,
  getAllReviews,
  getReview,
  updateReview,
  acknowledgeReview,
  autoCalculateScores,
  getPerformanceStats,
} = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', getPerformanceStats);
router.post('/auto-calculate', authorize('Admin', 'Manager'), autoCalculateScores);
router.get('/', getAllReviews);
router.get('/:id', getReview);
router.post('/', authorize('Admin', 'Manager'), createReview);
router.put('/:id', authorize('Admin', 'Manager'), updateReview);
router.patch('/:id/acknowledge', acknowledgeReview);

module.exports = router;
