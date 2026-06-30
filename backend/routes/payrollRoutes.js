/**
 * Payroll Routes
 * POST   /api/payroll/generate       → Admin, HR
 * GET    /api/payroll/stats          → Admin, HR
 * GET    /api/payroll                → All (own for Employee)
 * GET    /api/payroll/:id            → All (own for Employee)
 * PATCH  /api/payroll/:id/status     → Admin, HR
 * GET    /api/payroll/:id/payslip    → All (own for Employee)
 */

const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getAllPayroll,
  getPayroll,
  updatePayrollStatus,
  downloadPayslip,
  getPayrollStats,
} = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/generate', authorize('Admin', 'HR'), generatePayroll);
router.get('/stats', authorize('Admin', 'HR'), getPayrollStats);
router.get('/', getAllPayroll);
router.get('/:id', getPayroll);
router.patch('/:id/status', authorize('Admin', 'HR'), updatePayrollStatus);
router.get('/:id/payslip', downloadPayslip);

module.exports = router;
