/**
 * Employee Routes
 * GET    /api/employees             → Admin, HR, Manager
 * GET    /api/employees/stats       → Admin, HR
 * GET    /api/employees/:id         → All (own data for Employee)
 * POST   /api/employees             → Admin only
 * PUT    /api/employees/:id         → Admin, HR
 * DELETE /api/employees/:id         → Admin only
 * POST   /api/employees/:id/documents → Admin, HR
 * DELETE /api/employees/:id/documents/:docId → Admin, HR
 */

const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployee,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  getEmployeeStats,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadDocument, handleUploadError } = require('../middleware/uploadMiddleware');

router.use(protect); // All routes require authentication

router.get('/stats', authorize('Admin', 'HR'), getEmployeeStats);
router.get('/', authorize('Admin', 'HR', 'Manager'), getAllEmployees);
router.get('/:id', getEmployee); // Handled in controller (employee sees own only)
router.post('/', authorize('Admin'), addEmployee);
router.put('/:id', authorize('Admin', 'HR'), updateEmployee);
router.delete('/:id', authorize('Admin'), deleteEmployee);

// Document management
router.post('/:id/documents', authorize('Admin', 'HR'), uploadDocument.single('document'), handleUploadError, uploadEmployeeDocument);
router.delete('/:id/documents/:docId', authorize('Admin', 'HR'), deleteEmployeeDocument);

module.exports = router;
