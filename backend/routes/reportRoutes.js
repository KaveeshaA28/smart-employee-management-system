/**
 * Report Routes
 * GET /api/reports/dashboard   → Admin, HR, Manager
 * GET /api/reports/attendance  → Admin, HR, Manager
 * GET /api/reports/payroll     → Admin, HR
 * GET /api/reports/leave       → Admin, HR
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardReport,
  getAttendanceReport,
  getPayrollReport,
  getLeaveReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/dashboard', authorize('Admin', 'HR', 'Manager'), getDashboardReport);
router.get('/attendance', authorize('Admin', 'HR', 'Manager'), getAttendanceReport);
router.get('/payroll', authorize('Admin', 'HR'), getPayrollReport);
router.get('/leave', authorize('Admin', 'HR'), getLeaveReport);

module.exports = router;
