/**
 * Performance Controller
 * ============================================================
 * Manages performance reviews with KPI scoring.
 *
 * Formula: Overall = (Attendance + TaskCompletion + QualityOfWork) / 3
 */

const Performance = require('../models/Performance');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

/**
 * @desc    Create/Submit performance review
 * @route   POST /api/performance
 * @access  Private - Manager, Admin
 */
const createReview = async (req, res, next) => {
  try {
    const {
      employeeId,
      month,
      year,
      reviewType,
      scores,
      strengths,
      areasForImprovement,
      goals,
      managerComments,
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Check for existing review in the same period
    const existing = await Performance.findOne({
      employee: employeeId,
      'reviewPeriod.month': parseInt(month),
      'reviewPeriod.year': parseInt(year),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Performance review for this period already exists. Use update instead.`,
      });
    }

    const review = await Performance.create({
      employee: employeeId,
      reviewedBy: req.user._id,
      reviewPeriod: {
        month: parseInt(month),
        year: parseInt(year),
        type: reviewType || 'Monthly',
      },
      scores: {
        attendance: scores.attendance,
        taskCompletion: scores.taskCompletion,
        qualityOfWork: scores.qualityOfWork,
        communication: scores.communication || null,
        teamwork: scores.teamwork || null,
        leadership: scores.leadership || null,
      },
      strengths,
      areasForImprovement,
      goals,
      managerComments,
      status: 'Submitted',
    });

    const populatedReview = await Performance.findById(review._id)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('reviewedBy', 'firstName lastName role');

    res.status(201).json({
      success: true,
      message: `Performance review submitted. Overall Score: ${review.overallScore}/100 (${review.rating})`,
      data: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all performance reviews
 * @route   GET /api/performance
 * @access  Private
 */
const getAllReviews = async (req, res, next) => {
  try {
    const { employeeId, month, year, rating, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (req.user.role === 'Employee') {
      filter.employee = req.user._id;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    if (month) filter['reviewPeriod.month'] = parseInt(month);
    if (year) filter['reviewPeriod.year'] = parseInt(year);
    if (rating) filter.rating = rating;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Performance.find(filter)
        .populate('employee', 'firstName lastName employeeId department avatar')
        .populate('reviewedBy', 'firstName lastName designation')
        .sort({ 'reviewPeriod.year': -1, 'reviewPeriod.month': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Performance.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single performance review
 * @route   GET /api/performance/:id
 * @access  Private
 */
const getReview = async (req, res, next) => {
  try {
    const review = await Performance.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department designation avatar')
      .populate('reviewedBy', 'firstName lastName designation');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Employees can only see their own
    if (req.user.role === 'Employee' && review.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update performance review
 * @route   PUT /api/performance/:id
 * @access  Private - Manager, Admin
 */
const updateReview = async (req, res, next) => {
  try {
    const { scores, strengths, areasForImprovement, goals, managerComments } = req.body;

    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.status === 'Acknowledged') {
      return res.status(400).json({ success: false, message: 'Cannot update an acknowledged review.' });
    }

    review.scores = { ...review.scores, ...scores };
    if (strengths) review.strengths = strengths;
    if (areasForImprovement) review.areasForImprovement = areasForImprovement;
    if (goals) review.goals = goals;
    if (managerComments) review.managerComments = managerComments;

    await review.save();

    res.status(200).json({ success: true, message: 'Review updated.', data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Employee acknowledges their review
 * @route   PATCH /api/performance/:id/acknowledge
 * @access  Private - Employee (own review only)
 */
const acknowledgeReview = async (req, res, next) => {
  try {
    const { employeeComments } = req.body;

    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only acknowledge your own review.' });
    }

    review.employeeAcknowledged = true;
    review.employeeComments = employeeComments || '';
    review.acknowledgedAt = new Date();
    review.status = 'Acknowledged';
    await review.save();

    res.status(200).json({ success: true, message: 'Review acknowledged.', data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auto-calculate performance scores from data
 * @route   POST /api/performance/auto-calculate
 * @access  Private - Admin, Manager
 */
const autoCalculateScores = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.body;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Attendance score: (Present + Late) / Working Days * 100
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalDays = attendanceRecords.length || 1;
    const presentAndLate = attendanceRecords.filter((a) => ['Present', 'Late'].includes(a.status)).length;
    const attendanceScore = parseFloat(((presentAndLate / totalDays) * 100).toFixed(2));

    // Task completion score
    const [totalTasks, completedTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: employeeId, isDeleted: false, createdAt: { $gte: startDate, $lte: endDate } }),
      Task.countDocuments({ assignedTo: employeeId, isDeleted: false, status: 'Completed', completedAt: { $gte: startDate, $lte: endDate } }),
    ]);
    const taskScore = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      message: 'Auto-calculated scores (Quality score must be set manually by manager)',
      data: {
        attendanceScore: Math.min(100, attendanceScore),
        taskCompletionScore: Math.min(100, taskScore),
        qualityScore: null, // Manager must set this manually
        rawData: {
          totalDays,
          presentAndLate,
          totalTasks,
          completedTasks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get performance stats for dashboard
 * @route   GET /api/performance/stats
 * @access  Private
 */
const getPerformanceStats = async (req, res, next) => {
  try {
    const empId = req.user.role === 'Employee' ? req.user._id : req.query.employeeId;

    const stats = await Performance.aggregate([
      ...(empId ? [{ $match: { employee: require('mongoose').Types.ObjectId.createFromHexString(empId.toString()) } }] : []),
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
        },
      },
    ]);

    const trend = await Performance.find(empId ? { employee: empId } : {})
      .sort({ 'reviewPeriod.year': 1, 'reviewPeriod.month': 1 })
      .limit(12)
      .select('reviewPeriod.label overallScore scores rating');

    res.status(200).json({ success: true, data: { byRating: stats, trend } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getAllReviews, getReview, updateReview, acknowledgeReview, autoCalculateScores, getPerformanceStats };
