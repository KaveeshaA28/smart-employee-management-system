/**
 * Task Routes
 * GET    /api/tasks/stats    → All (filtered by role)
 * GET    /api/tasks          → All (own for Employee)
 * GET    /api/tasks/:id      → All
 * POST   /api/tasks          → Admin, Manager
 * PUT    /api/tasks/:id      → Admin, Manager
 * PATCH  /api/tasks/:id/status    → Assignee, Admin, Manager
 * POST   /api/tasks/:id/comments → All participants
 * DELETE /api/tasks/:id     → Admin, Manager
 */

const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  addComment,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/', getAllTasks);
router.get('/:id', getTask);
router.post('/', authorize('Admin', 'Manager'), createTask);
router.put('/:id', authorize('Admin', 'Manager'), updateTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);
router.delete('/:id', authorize('Admin', 'Manager'), deleteTask);

module.exports = router;
