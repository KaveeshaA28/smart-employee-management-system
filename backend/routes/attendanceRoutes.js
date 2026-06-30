/**
 * Attendance Routes
 * POST   /api/attendance/check-in          → All employees
 * POST   /api/attendance/check-out         → All employees
 * POST   /api/attendance/mark             → Admin, HR
 * GET    /api/attendance/today            → Admin, HR, Manager
 * GET    /api/attendance/stats/:employeeId → All (own for Employee)
 * GET    /api/attendance                  → All (filtered by role)
 */

const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  markAttendance,
  getAttendance,
  getTodayAttendance,
  getAttendanceStats,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/mark', authorize('Admin', 'HR'), markAttendance);
router.get('/today', authorize('Admin', 'HR', 'Manager'), getTodayAttendance);
router.get('/stats/:employeeId', getAttendanceStats);
router.get('/', getAttendance);

module.exports = router;
