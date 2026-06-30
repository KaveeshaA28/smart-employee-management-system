/**
 * Report Controller
 * ============================================================
 * Generates comprehensive reports as JSON or PDF:
 * - Attendance reports
 * - Payroll summary
 * - Leave reports
 * - Employee overview
 * - Dashboard analytics
 */

const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Task = require('../models/Task');
const Performance = require('../models/Performance');
const { generateAttendanceReportPDF, generateGenericReportPDF } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get dashboard analytics summary
 * @route   GET /api/reports/dashboard
 * @access  Private - Admin, HR, Manager
 */
const getDashboardReport = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalEmployees,
      activeEmployees,
      todayPresent,
      todayAbsent,
      pendingLeaves,
      openTasks,
      overdueTasks,
    ] = await Promise.all([
      Employee.countDocuments({ isDeleted: false }),
      Employee.countDocuments({ status: 'Active', isDeleted: false }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: { $in: ['Present', 'Late'] } }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'Absent' }),
      Leave.countDocuments({ finalStatus: 'Pending' }),
      Task.countDocuments({ status: { $in: ['To Do', 'In Progress', 'Review'] }, isDeleted: false }),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $nin: ['Completed', 'Cancelled'] }, isDeleted: false }),
    ]);

    // Monthly payroll total
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const payrollSummary = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalNet: { $sum: '$netSalary' }, totalGross: { $sum: '$grossSalary' }, count: { $sum: 1 } } },
    ]);

    // Attendance trend (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      last7Days.push(d);
    }

    const attendanceTrend = await Attendance.aggregate([
      { $match: { date: { $gte: last7Days[0], $lte: new Date() } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, status: '$status' }, count: { $sum: 1 } } },
    ]);

    // Department breakdown
    const deptBreakdown = await Employee.aggregate([
      { $match: { isDeleted: false, status: 'Active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          todayPresent,
          todayAbsent,
          pendingLeaves,
          openTasks,
          overdueTasks,
          attendanceRate: activeEmployees > 0 ? parseFloat(((todayPresent / activeEmployees) * 100).toFixed(1)) : 0,
        },
        payrollThisMonth: payrollSummary[0] || { totalNet: 0, totalGross: 0, count: 0 },
        attendanceTrend,
        departmentBreakdown: deptBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate attendance report (JSON + PDF option)
 * @route   GET /api/reports/attendance
 * @access  Private - Admin, HR, Manager
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId, department, format = 'json' } = req.query;

    const filter = {};
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (employeeId) filter.employee = employeeId;

    // Join with employees if department filter
    let records = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 })
      .limit(1000);

    if (department) {
      records = records.filter((r) => r.employee?.department === department);
    }

    if (format === 'pdf') {
      const label = startDate && endDate
        ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
        : 'All Time';

      const pdfUrl = await generateAttendanceReportPDF(records, { label });
      const filePath = path.join(__dirname, '..', pdfUrl);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Attendance_Report.pdf"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    // Summary stats
    const summary = {
      totalRecords: records.length,
      present: records.filter((r) => r.status === 'Present').length,
      late: records.filter((r) => r.status === 'Late').length,
      absent: records.filter((r) => r.status === 'Absent').length,
      halfDay: records.filter((r) => r.status === 'Half-Day').length,
      avgWorkingHours: records.length > 0
        ? parseFloat((records.reduce((s, r) => s + (r.workingHours || 0), 0) / records.length).toFixed(2))
        : 0,
    };

    res.status(200).json({ success: true, summary, data: records });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate payroll summary report
 * @route   GET /api/reports/payroll
 * @access  Private - Admin, HR
 */
const getPayrollReport = async (req, res, next) => {
  try {
    const { month, year, format = 'json' } = req.query;

    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const payrolls = await Payroll.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ 'employee.department': 1 });

    const summary = {
      totalRecords: payrolls.length,
      totalGross: payrolls.reduce((s, p) => s + p.grossSalary, 0).toFixed(2),
      totalDeductions: payrolls.reduce((s, p) => s + p.totalDeductions, 0).toFixed(2),
      totalNet: payrolls.reduce((s, p) => s + p.netSalary, 0).toFixed(2),
      paid: payrolls.filter((p) => p.status === 'Paid').length,
      pending: payrolls.filter((p) => p.status !== 'Paid').length,
    };

    if (format === 'pdf') {
      const pdfUrl = await generateGenericReportPDF(
        `Payroll Report - ${month ? `Month ${month}/` : ''}${year || ''}`,
        summary,
        `This report contains payroll data for ${payrolls.length} employees.`
      );
      const filePath = path.join(__dirname, '..', pdfUrl);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Payroll_Report.pdf"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    res.status(200).json({ success: true, summary, data: payrolls });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate leave report
 * @route   GET /api/reports/leave
 * @access  Private - Admin, HR
 */
const getLeaveReport = async (req, res, next) => {
  try {
    const { month, year, leaveType, status } = req.query;

    const filter = {};
    if (leaveType) filter.leaveType = leaveType;
    if (status) filter.finalStatus = status;
    if (month && year) {
      filter.startDate = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ createdAt: -1 });

    const summary = {
      total: leaves.length,
      approved: leaves.filter((l) => l.finalStatus === 'Approved').length,
      rejected: leaves.filter((l) => l.finalStatus === 'Rejected').length,
      pending: leaves.filter((l) => l.finalStatus === 'Pending').length,
      totalDays: leaves.filter((l) => l.finalStatus === 'Approved').reduce((s, l) => s + (l.numberOfDays || 0), 0),
    };

    res.status(200).json({ success: true, summary, data: leaves });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardReport, getAttendanceReport, getPayrollReport, getLeaveReport };
