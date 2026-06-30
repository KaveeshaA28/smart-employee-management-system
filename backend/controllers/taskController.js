/**
 * Task Controller
 * ============================================================
 * Task management with status workflow and comments.
 *
 * Workflow: To Do → In Progress → Review → Completed
 */

const Task = require('../models/Task');
const Employee = require('../models/Employee');
const { sendTaskAssignmentEmail } = require('../services/emailService');

/**
 * @desc    Create and assign a task
 * @route   POST /api/tasks
 * @access  Private - Admin, Manager
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, dueDate, category, tags } = req.body;

    const assignee = await Employee.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({ success: false, message: 'Assigned employee not found.' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || 'Medium',
      dueDate: new Date(dueDate),
      category: category || 'General',
      tags: tags || [],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName employeeId email')
      .populate('assignedBy', 'firstName lastName');

    // Send email to assignee
    sendTaskAssignmentEmail(assignee, task).catch(console.error);

    res.status(201).json({
      success: true,
      message: `Task '${task.title}' assigned to ${assignee.firstName} ${assignee.lastName}.`,
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks (filtered)
 * @route   GET /api/tasks
 * @access  Private
 */
const getAllTasks = async (req, res, next) => {
  try {
    const {
      assignedTo,
      assignedBy,
      status,
      priority,
      category,
      page = 1,
      limit = 10,
      overdue,
    } = req.query;

    const filter = { isDeleted: false };

    // Employees see only their own tasks
    if (req.user.role === 'Employee') {
      filter.assignedTo = req.user._id;
    } else {
      if (assignedTo) filter.assignedTo = assignedTo;
      if (assignedBy) filter.assignedBy = assignedBy;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    // Overdue filter
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ['Completed', 'Cancelled'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'firstName lastName employeeId avatar')
        .populate('assignedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'firstName lastName employeeId email avatar')
      .populate('assignedBy', 'firstName lastName role')
      .populate('comments.author', 'firstName lastName role avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details
 * @route   PUT /api/tasks/:id
 * @access  Private - Admin, Manager
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, category, tags } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { title, description, priority, dueDate: dueDate ? new Date(dueDate) : undefined, category, tags },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, message: 'Task updated.', data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status (workflow transition)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private - Assignee, Admin, Manager
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, progress, comment } = req.body;

    const validStatuses = ['To Do', 'In Progress', 'Review', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Valid: ${validStatuses.join(', ')}` });
    }

    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Only assignee, admin, or manager can update status
    const canUpdate =
      ['Admin', 'Manager'].includes(req.user.role) ||
      task.assignedTo.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this task status.' });
    }

    task.status = status;
    if (progress !== undefined) task.progress = Math.min(100, Math.max(0, parseInt(progress)));

    // Add comment if provided
    if (comment) {
      task.comments.push({ author: req.user._id, content: comment });
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('assignedBy', 'firstName lastName')
      .populate('comments.author', 'firstName lastName role');

    res.status(200).json({ success: true, message: `Task status updated to '${status}'.`, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private - Task participants
 */
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $push: { comments: { author: req.user._id, content: content.trim() } } },
      { new: true }
    ).populate('comments.author', 'firstName lastName role avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(201).json({ success: true, message: 'Comment added.', comments: task.comments });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task (soft delete)
 * @route   DELETE /api/tasks/:id
 * @access  Private - Admin, Manager
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task stats (for dashboard)
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };
    if (req.user.role === 'Employee') filter.assignedTo = req.user._id;

    const stats = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const overdue = await Task.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['Completed', 'Cancelled'] },
    });

    res.status(200).json({ success: true, data: { byStatus: stats, overdue } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getAllTasks, getTask, updateTask, updateTaskStatus, addComment, deleteTask, getTaskStats };
