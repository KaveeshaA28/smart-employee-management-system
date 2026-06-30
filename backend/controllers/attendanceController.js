/**
 * Attendance Controller
 * ============================================================
 * Handles: Check-In/Out, Attendance History, Reports
 *
 * Features:
 * - Self check-in/out (auto time tracking)
 * - Admin can mark attendance manually
 * - Daily attendance summary
 * - Filter by date range, employee, status
 */

const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

/**
 * @desc    Employee check-in (mark Present/Late)
 * @route   POST /api/attendance/check-in
 * @access  Private - All roles
 */
const checkIn = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already checked in today.',
        attendance: existing,
      });
    }

    const now = new Date();
    // Late if after 9:30 AM
    const lateThreshold = new Date(now);
    lateThreshold.setHours(9, 30, 0, 0);
    const status = now > lateThreshold ? 'Late' : 'Present';

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      status,
      checkIn: now,
      checkInLocation: {
        ip: req.ip,
        device: req.headers['user-agent']?.substring(0, 100),
      },
    });

    res.status(201).json({
      success: true,
      message: `Check-in recorded. Status: ${status}`,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Employee check-out
 * @route   POST /api/attendance/check-out
 * @access  Private - All roles
 */
const checkOut = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No check-in record found for today.' });
    }

    if (attendance.checkOut) {
      return res.status(409).json({ success: false, message: 'You have already checked out today.' });
    }

    attendance.checkOut = new Date();
    await attendance.save(); // Pre-save hook calculates working hours

    res.status(200).json({
      success: true,
      message: `Check-out recorded. Hours worked: ${attendance.workingHours}h`,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark attendance manually (Admin/HR)
 * @route   POST /api/attendance/mark
 * @access  Private - Admin, HR
 */
const markAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, note } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Upsert attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: attendanceDate },
      {
        status,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        note,
        markedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Manually trigger pre-save hook logic for working hours
    if (attendance.checkIn && attendance.checkOut) {
      const diffMs = new Date(attendance.checkOut) - new Date(attendance.checkIn);
      attendance.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      attendance.overtime = attendance.workingHours > 8 ? parseFloat((attendance.workingHours - 8).toFixed(2)) : 0;
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully.',
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance records (with filters)
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendance = async (req, res, next) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      status,
      month,
      year,
      page = 1,
      limit = 31,
    } = req.query;

    const filter = {};

    // Employees see only their own records
    if (req.user.role === 'Employee') {
      filter.employee = req.user._id;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'firstName lastName employeeId department')
        .populate('markedBy', 'firstName lastName')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get today's attendance summary
 * @route   GET /api/attendance/today
 * @access  Private - Admin, HR, Manager
 */
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [summary, records] = await Promise.all([
      Attendance.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Attendance.find({ date: { $gte: today, $lt: tomorrow } })
        .populate('employee', 'firstName lastName employeeId department avatar')
        .sort({ checkIn: 1 })
        .limit(50),
    ]);

    const totalEmployees = await Employee.countDocuments({ status: 'Active', isDeleted: false });
    const presentCount = summary.find((s) => s._id === 'Present')?.count || 0;
    const lateCount = summary.find((s) => s._id === 'Late')?.count || 0;
    const absentCount = totalEmployees - presentCount - lateCount;

    res.status(200).json({
      success: true,
      data: {
        date: today,
        totalEmployees,
        present: presentCount,
        late: lateCount,
        absent: Math.max(0, absentCount),
        summaryBreakdown: summary,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance statistics for an employee
 * @route   GET /api/attendance/stats/:employeeId
 * @access  Private
 */
const getAttendanceStats = async (req, res, next) => {
  try {
    const empId = req.params.employeeId || req.user._id;

    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    const stats = await Attendance.aggregate([
      {
        $match: {
          employee: require('mongoose').Types.ObjectId.createFromHexString(empId.toString()),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$workingHours' },
          totalOvertime: { $sum: '$overtime' },
        },
      },
    ]);

    res.status(200).json({ success: true, month: currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }), stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, markAttendance, getAttendance, getTodayAttendance, getAttendanceStats };
