/**
 * Payroll Controller
 * ============================================================
 * Manages payroll generation, payslip PDF, and salary records.
 *
 * Formula: Net Salary = (Basic + Allowances + OT Pay) - (Deductions + Tax + Loans)
 */

const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { generatePayslipPDF } = require('../services/pdfService');
const { sendPayslipNotificationEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Generate payroll for an employee
 * @route   POST /api/payroll/generate
 * @access  Private - Admin, HR
 */
const generatePayroll = async (req, res, next) => {
  try {
    const {
      employeeId,
      month,
      year,
      allowances,
      deductions,
      tax,
      loans,
      overtimeRate,
      paymentMethod,
      notes,
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Check if payroll already exists
    const existing = await Payroll.findOne({ employee: employeeId, month: parseInt(month), year: parseInt(year) });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Payroll for ${employee.firstName} ${employee.lastName} for this period already exists.`,
      });
    }

    // Fetch attendance data for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate attendance stats
    const presentDays = attendanceRecords.filter((a) => a.status === 'Present').length;
    const lateDays = attendanceRecords.filter((a) => a.status === 'Late').length;
    const absentDays = attendanceRecords.filter((a) => a.status === 'Absent').length;
    const totalOvertimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtime || 0), 0);

    // Working days in month (excluding weekends approx)
    const workingDays = Math.min(23, presentDays + lateDays + absentDays) || 22;

    // Calculate overtime pay
    const hourlyRate = employee.basicSalary / (workingDays * 8);
    const overtimePay = parseFloat((totalOvertimeHours * hourlyRate * 1.5).toFixed(2));

    // Absence deduction
    const absenceDeduction = parseFloat((absentDays * (employee.basicSalary / workingDays)).toFixed(2));

    const payrollData = {
      employee: employeeId,
      month: parseInt(month),
      year: parseInt(year),
      basicSalary: employee.basicSalary,
      allowances: {
        houseRent: allowances?.houseRent || 0,
        transport: allowances?.transport || 0,
        medical: allowances?.medical || 0,
        food: allowances?.food || 0,
        other: allowances?.other || 0,
      },
      deductions: {
        providentFund: deductions?.providentFund || 0,
        insurance: deductions?.insurance || 0,
        absence: absenceDeduction,
        other: deductions?.other || 0,
      },
      tax: tax || 0,
      loans: loans || 0,
      workingDays,
      presentDays,
      absentDays,
      lateDays,
      overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      overtimePay,
      status: 'Generated',
      paymentMethod: paymentMethod || null,
      generatedBy: req.user._id,
      notes: notes || '',
    };

    const payroll = await Payroll.create(payrollData);

    // Populate employee for PDF
    const populatedPayroll = await Payroll.findById(payroll._id).populate(
      'employee',
      'firstName lastName employeeId department designation email fullName'
    );

    // Generate PDF payslip
    const payslipUrl = await generatePayslipPDF(populatedPayroll);
    await Payroll.findByIdAndUpdate(payroll._id, { payslipUrl });
    populatedPayroll.payslipUrl = payslipUrl;

    // Send email notification
    sendPayslipNotificationEmail(employee, populatedPayroll).catch(console.error);

    res.status(201).json({
      success: true,
      message: `Payroll generated for ${employee.firstName} ${employee.lastName} - ${populatedPayroll.payPeriodLabel}`,
      data: { ...populatedPayroll.toObject(), payslipUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payroll records
 * @route   GET /api/payroll
 * @access  Private - Admin, HR
 */
const getAllPayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (req.user.role === 'Employee') {
      filter.employee = req.user._id;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate('employee', 'firstName lastName employeeId department')
        .populate('generatedBy', 'firstName lastName')
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payroll.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payroll record
 * @route   GET /api/payroll/:id
 * @access  Private
 */
const getPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId department designation email')
      .populate('generatedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found.' });
    }

    // Employees see only own
    if (req.user.role === 'Employee' && payroll.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update payroll status (mark as Paid)
 * @route   PATCH /api/payroll/:id/status
 * @access  Private - Admin, HR
 */
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.body;

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      {
        status,
        paymentMethod,
        paidAt: status === 'Paid' ? new Date() : null,
      },
      { new: true }
    ).populate('employee', 'firstName lastName employeeId');

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found.' });
    }

    res.status(200).json({ success: true, message: `Payroll status updated to ${status}.`, data: payroll });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download payslip PDF
 * @route   GET /api/payroll/:id/payslip
 * @access  Private
 */
const downloadPayslip = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      'employee',
      'firstName lastName employeeId department designation email fullName'
    );

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found.' });
    }

    // Employee can only download own payslip
    if (req.user.role === 'Employee' && payroll.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Regenerate PDF if not exists
    let payslipUrl = payroll.payslipUrl;
    if (!payslipUrl || !fs.existsSync(path.join(__dirname, '..', payslipUrl))) {
      payslipUrl = await generatePayslipPDF(payroll);
      await Payroll.findByIdAndUpdate(payroll._id, { payslipUrl });
    }

    const filePath = path.join(__dirname, '..', payslipUrl);
    const filename = `Payslip_${payroll.employee.employeeId}_${payroll.payPeriodLabel.replace(' ', '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payroll summary/stats
 * @route   GET /api/payroll/stats
 * @access  Private - Admin, HR
 */
const getPayrollStats = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const stats = await Payroll.aggregate([
      { $match: { year: parseInt(year) } },
      {
        $group: {
          _id: '$month',
          totalNetSalary: { $sum: '$netSalary' },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, year: parseInt(year), data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePayroll,
  getAllPayroll,
  getPayroll,
  updatePayrollStatus,
  downloadPayslip,
  getPayrollStats,
};
