/**
 * Leave Routes
 * POST   /api/leave/apply              → All employees
 * GET    /api/leave                    → All (filtered by role)
 * GET    /api/leave/balance/:id        → All (own for Employee)
 * GET    /api/leave/:id                → All (own for Employee)
 * PATCH  /api/leave/:id/hr-review      → HR only
 * PATCH  /api/leave/:id/manager-review → Manager, Admin
 * PATCH  /api/leave/:id/cancel        → Own Employee, Admin
 */

const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getAllLeaves,
  getLeave,
  hrReview,
  managerReview,
  cancelLeave,
  getLeaveBalance,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadLeaveDocument, handleUploadError } = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/apply', uploadLeaveDocument.single('document'), handleUploadError, applyLeave);
router.get('/balance/:employeeId', getLeaveBalance);
router.get('/', getAllLeaves);
router.get('/:id', getLeave);
router.patch('/:id/hr-review', authorize('HR', 'Admin'), hrReview);
router.patch('/:id/manager-review', authorize('Manager', 'Admin'), managerReview);
router.patch('/:id/cancel', cancelLeave);

module.exports = router;
