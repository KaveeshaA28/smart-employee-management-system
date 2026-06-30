/**
 * Leave Controller
 * ============================================================
 * Manages leave applications, HR approvals, Manager reviews.
 *
 * Workflow:
 * Employee applies → HR approves/rejects → Manager approves/rejects → Final
 */

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { sendLeaveStatusEmail } = require('../services/emailService');

/**
 * @desc    Apply for leave
 * @route   POST /api/leave/apply
 * @access  Private - All employees
 */
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason, isHalfDay, halfDaySession } = req.body;

    const employee = await Employee.findById(req.user._id);

    // Validate leave balance
    const leaveKey = leaveType.toLowerCase();
    const balance = employee.leaveBalance[leaveKey] || 0;

    // Calculate days requested
    let daysRequested;
    if (isHalfDay) {
      daysRequested = 0.5;
    } else {
      const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
      daysRequested = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    if (leaveType !== 'Unpaid' && balance < daysRequested) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${balance} days, Requested: ${daysRequested} days.`,
      });
    }

    // Check for overlapping leave requests
    const overlap = await Leave.findOne({
      employee: req.user._id,
      finalStatus: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'You already have an overlapping leave request for this period.',
      });
    }

    // Handle document upload
    let document = null;
    if (req.file) {
      document = {
        name: req.file.originalname,
        url: `/uploads/leave-docs/${req.file.filename}`,
        uploadedAt: new Date(),
      };
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      isHalfDay: isHalfDay || false,
      halfDaySession: halfDaySession || null,
      document,
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully. Awaiting HR approval.',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all leave requests
 * @route   GET /api/leave
 * @access  Private
 */
const getAllLeaves = async (req, res, next) => {
  try {
    const { employeeId, status, leaveType, month, year, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Employees see only their own
    if (req.user.role === 'Employee') {
      filter.employee = req.user._id;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    if (status) filter.finalStatus = status;
    if (leaveType) filter.leaveType = leaveType;

    if (month && year) {
      filter.startDate = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate('employee', 'firstName lastName employeeId department')
        .populate('hrReviewedBy', 'firstName lastName')
        .populate('managerReviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Leave.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single leave request
 * @route   GET /api/leave/:id
 * @access  Private
 */
const getLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId email department')
      .populate('hrReviewedBy', 'firstName lastName')
      .populate('managerReviewedBy', 'firstName lastName');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // Employees can only view their own
    if (req.user.role === 'Employee' && leave.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    HR approves or rejects a leave request
 * @route   PATCH /api/leave/:id/hr-review
 * @access  Private - HR only
 */
const hrReview = async (req, res, next) => {
  try {
    const { status, comment } = req.body; // status: 'Approved' | 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (leave.hrStatus !== 'Pending') {
      return res.status(409).json({ success: false, message: 'This leave has already been reviewed by HR.' });
    }

    leave.hrStatus = status;
    leave.hrReviewedBy = req.user._id;
    leave.hrReviewedAt = new Date();
    leave.hrComment = comment || '';

    // If HR rejects, final status becomes Rejected
    if (status === 'Rejected') {
      leave.finalStatus = 'Rejected';
    }

    await leave.save();

    // Send email notification
    sendLeaveStatusEmail(leave.employee, leave, status, comment).catch(console.error);

    res.status(200).json({
      success: true,
      message: `Leave request ${status} by HR.`,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manager approves or rejects a leave request
 * @route   PATCH /api/leave/:id/manager-review
 * @access  Private - Manager, Admin
 */
const managerReview = async (req, res, next) => {
  try {
    const { status, comment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (leave.hrStatus !== 'Approved') {
      return res.status(400).json({ success: false, message: 'HR must approve first before manager review.' });
    }

    if (leave.managerStatus !== 'Pending') {
      return res.status(409).json({ success: false, message: 'Manager has already reviewed this request.' });
    }

    leave.managerStatus = status;
    leave.managerReviewedBy = req.user._id;
    leave.managerReviewedAt = new Date();
    leave.managerComment = comment || '';

    // Final status determined by manager decision
    leave.finalStatus = status;

    // If approved: deduct leave balance
    if (status === 'Approved') {
      const employee = await Employee.findById(leave.employee._id);
      const leaveKey = leave.leaveType.toLowerCase();
      if (employee.leaveBalance[leaveKey] !== undefined && leave.leaveType !== 'Unpaid') {
        employee.leaveBalance[leaveKey] = Math.max(0, employee.leaveBalance[leaveKey] - leave.numberOfDays);
        employee.status = 'On-Leave';
        await employee.save({ validateBeforeSave: false });
      }
    }

    await leave.save();

    sendLeaveStatusEmail(leave.employee, leave, status, comment).catch(console.error);

    res.status(200).json({
      success: true,
      message: `Leave request ${status} by Manager.`,
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a leave request
 * @route   PATCH /api/leave/:id/cancel
 * @access  Private - Employee (own), Admin
 */
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // Employees can only cancel their own
    if (req.user.role === 'Employee' && leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (leave.finalStatus === 'Approved') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already approved leave. Contact HR.' });
    }

    if (leave.finalStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Leave is already cancelled.' });
    }

    leave.finalStatus = 'Cancelled';
    leave.cancelledAt = new Date();
    leave.cancelReason = req.body.reason || '';
    await leave.save();

    res.status(200).json({ success: true, message: 'Leave request cancelled.', data: leave });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get leave balance for an employee
 * @route   GET /api/leave/balance/:employeeId
 * @access  Private
 */
const getLeaveBalance = async (req, res, next) => {
  try {
    const empId = req.params.employeeId || req.user._id;

    const employee = await Employee.findById(empId).select('leaveBalance firstName lastName employeeId');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyLeave, getAllLeaves, getLeave, hrReview, managerReview, cancelLeave, getLeaveBalance };
