/**
 * PDF Service - PDFKit
 * ============================================================
 * Generates professional PDF documents:
 * - Payslips
 * - Attendance Reports
 * - Leave Reports
 * - General Reports
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ─── Ensure uploads/pdf directory exists ──────────────────────────────────────
const PDF_DIR = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#1E3A5F',
  secondary: '#2ECC71',
  accent: '#3498DB',
  dark: '#2C3E50',
  light: '#ECF0F1',
  danger: '#E74C3C',
  warning: '#F39C12',
  text: '#34495E',
  border: '#BDC3C7',
};

/**
 * Add a styled header to the PDF
 */
const addHeader = (doc, title, subtitle = '') => {
  // Background bar
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);

  // Company Name
  doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold').text('Smart Employee Management System', 40, 15, { align: 'center' });

  // Title
  doc.fontSize(12).fillColor('#A8D8EA').font('Helvetica').text(title, 40, 42, { align: 'center' });

  if (subtitle) {
    doc.fontSize(10).fillColor('#A8D8EA').text(subtitle, 40, 60, { align: 'center' });
  }

  doc.moveDown(3);
  doc.fillColor(COLORS.text);
};

/**
 * Add a section title
 */
const addSectionTitle = (doc, title) => {
  doc
    .rect(40, doc.y, doc.page.width - 80, 22)
    .fill(COLORS.light)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(title.toUpperCase(), 50, doc.y + 6);
  doc.moveDown(1.5);
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(10);
};

/**
 * Add a key-value row to the PDF
 */
const addRow = (doc, label, value, x = 40) => {
  const y = doc.y;
  doc.font('Helvetica-Bold').fillColor(COLORS.dark).text(`${label}:`, x, y, { width: 160, continued: false });
  doc.font('Helvetica').fillColor(COLORS.text).text(`${value || 'N/A'}`, x + 165, y, { width: 250 });
  doc.moveDown(0.4);
};

/**
 * Add a horizontal divider
 */
const addDivider = (doc) => {
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
};

/**
 * Generate a Payslip PDF
 * @param {Object} payrollData - Populated Payroll document
 * @returns {string} - File path of the generated PDF
 */
const generatePayslipPDF = async (payrollData) => {
  return new Promise((resolve, reject) => {
    const fileName = `payslip_${payrollData.employee._id}_${payrollData.year}_${String(payrollData.month).padStart(2, '0')}_${Date.now()}.pdf`;
    const filePath = path.join(PDF_DIR, fileName);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    addHeader(doc, 'EMPLOYEE PAYSLIP', `Pay Period: ${payrollData.payPeriodLabel}`);

    // Employee Info Section
    addSectionTitle(doc, 'Employee Information');
    addRow(doc, 'Employee ID', payrollData.employee.employeeId);
    addRow(doc, 'Employee Name', payrollData.employee.fullName || `${payrollData.employee.firstName} ${payrollData.employee.lastName}`);
    addRow(doc, 'Department', payrollData.employee.department);
    addRow(doc, 'Designation', payrollData.employee.designation);
    addRow(doc, 'Pay Period', payrollData.payPeriodLabel);

    addDivider(doc);

    // Earnings Section
    addSectionTitle(doc, 'Earnings');
    addRow(doc, 'Basic Salary', `$${payrollData.basicSalary.toFixed(2)}`);
    addRow(doc, 'House Rent Allowance', `$${payrollData.allowances.houseRent.toFixed(2)}`);
    addRow(doc, 'Transport Allowance', `$${payrollData.allowances.transport.toFixed(2)}`);
    addRow(doc, 'Medical Allowance', `$${payrollData.allowances.medical.toFixed(2)}`);
    addRow(doc, 'Food Allowance', `$${payrollData.allowances.food.toFixed(2)}`);
    addRow(doc, 'Other Allowances', `$${payrollData.allowances.other.toFixed(2)}`);
    addRow(doc, 'Overtime Pay', `$${(payrollData.overtimePay || 0).toFixed(2)}`);

    // Gross total row
    doc.rect(40, doc.y, doc.page.width - 80, 20).fill('#E8F5E9');
    doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10).text('GROSS SALARY:', 50, doc.y + 5, { width: 160 });
    doc.text(`$${payrollData.grossSalary.toFixed(2)}`, 215, doc.y, { width: 250 });
    doc.moveDown(1.5);

    addDivider(doc);

    // Deductions Section
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10);
    addSectionTitle(doc, 'Deductions');
    addRow(doc, 'Provident Fund', `$${payrollData.deductions.providentFund.toFixed(2)}`);
    addRow(doc, 'Insurance', `$${payrollData.deductions.insurance.toFixed(2)}`);
    addRow(doc, 'Absence Deduction', `$${payrollData.deductions.absence.toFixed(2)}`);
    addRow(doc, 'Other Deductions', `$${payrollData.deductions.other.toFixed(2)}`);
    addRow(doc, 'Income Tax', `$${payrollData.tax.toFixed(2)}`);
    addRow(doc, 'Loan Deductions', `$${payrollData.loans.toFixed(2)}`);

    // Total deductions row
    doc.rect(40, doc.y, doc.page.width - 80, 20).fill('#FFEBEE');
    doc.fillColor(COLORS.danger).font('Helvetica-Bold').fontSize(10).text('TOTAL DEDUCTIONS:', 50, doc.y + 5, { width: 160 });
    doc.text(`$${payrollData.totalDeductions.toFixed(2)}`, 215, doc.y, { width: 250 });
    doc.moveDown(2);

    addDivider(doc);

    // NET SALARY - highlighted box
    doc.rect(40, doc.y, doc.page.width - 80, 35).fill(COLORS.primary);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('NET SALARY:', 50, doc.y + 10, { width: 200 });
    doc.fontSize(14).text(`$${payrollData.netSalary.toFixed(2)}`, 50, doc.y, { align: 'right', width: doc.page.width - 100 });
    doc.moveDown(3);

    // Attendance Summary
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10);
    addSectionTitle(doc, 'Attendance Summary');
    addRow(doc, 'Working Days', payrollData.workingDays);
    addRow(doc, 'Days Present', payrollData.presentDays);
    addRow(doc, 'Days Absent', payrollData.absentDays);
    addRow(doc, 'Late Arrivals', payrollData.lateDays);
    addRow(doc, 'Overtime Hours', `${payrollData.overtimeHours} hrs`);

    addDivider(doc);

    // Footer
    doc
      .fontSize(8)
      .fillColor(COLORS.border)
      .text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 40, doc.page.height - 60, { align: 'left' })
      .text('This is a computer-generated document. No signature required.', 40, doc.page.height - 48, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve(`/uploads/pdfs/${fileName}`));
    writeStream.on('error', reject);
  });
};

/**
 * Generate Attendance Report PDF
 * @param {Array} records - Attendance records
 * @param {Object} options - { employeeName, month, year }
 */
const generateAttendanceReportPDF = async (records, options = {}) => {
  return new Promise((resolve, reject) => {
    const fileName = `attendance_report_${Date.now()}.pdf`;
    const filePath = path.join(PDF_DIR, fileName);

    const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    addHeader(doc, 'ATTENDANCE REPORT', options.label || '');

    // Table header
    const tableTop = doc.y;
    const colWidths = [80, 120, 80, 80, 80, 80, 80, 100];
    const headers = ['Date', 'Employee', 'Status', 'Check In', 'Check Out', 'Hours', 'OT Hrs', 'Note'];

    let xPos = 40;
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill(COLORS.primary);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
    headers.forEach((h, i) => {
      doc.text(h, xPos + 3, tableTop + 6, { width: colWidths[i] - 4 });
      xPos += colWidths[i];
    });
    doc.moveDown(1.5);

    // Table rows
    records.forEach((record, idx) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage({ layout: 'landscape' });
      }
      const rowY = doc.y;
      const bg = idx % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
      doc.rect(40, rowY, doc.page.width - 80, 16).fill(bg);
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(7.5);

      xPos = 40;
      const cols = [
        new Date(record.date).toLocaleDateString(),
        record.employee?.firstName ? `${record.employee.firstName} ${record.employee.lastName}` : (record.employeeName || 'N/A'),
        record.status,
        record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-',
        record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
        `${record.workingHours || 0}h`,
        `${record.overtime || 0}h`,
        record.note || '-',
      ];
      cols.forEach((c, i) => {
        // Color status cells
        if (i === 2) {
          const statusColors = { Present: '#27AE60', Late: '#F39C12', Absent: '#E74C3C', 'Half-Day': '#8E44AD' };
          doc.fillColor(statusColors[c] || COLORS.text);
        } else {
          doc.fillColor(COLORS.text);
        }
        doc.text(String(c), xPos + 3, rowY + 4, { width: colWidths[i] - 4 });
        xPos += colWidths[i];
      });
      doc.moveDown(0.5);
    });

    // Footer
    doc.fontSize(8).fillColor(COLORS.border).text(`Total Records: ${records.length} | Generated: ${new Date().toLocaleString()}`, 40, doc.page.height - 40, { align: 'center' });

    doc.end();
    writeStream.on('finish', () => resolve(`/uploads/pdfs/${fileName}`));
    writeStream.on('error', reject);
  });
};

/**
 * Generate a generic report PDF
 * @param {string} title - Report title
 * @param {Object} data - Key-value summary data
 * @param {string} description - Additional info
 */
const generateGenericReportPDF = async (title, data = {}, description = '') => {
  return new Promise((resolve, reject) => {
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(PDF_DIR, fileName);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    addHeader(doc, title);

    if (description) {
      doc.fontSize(10).fillColor(COLORS.text).text(description, 40, doc.y, { align: 'justify' });
      doc.moveDown(1);
    }

    addSectionTitle(doc, 'Summary');
    Object.entries(data).forEach(([key, val]) => {
      addRow(doc, key, String(val));
    });

    doc.fontSize(8).fillColor(COLORS.border).text(`Generated: ${new Date().toLocaleString()}`, 40, doc.page.height - 40, { align: 'center' });

    doc.end();
    writeStream.on('finish', () => resolve(`/uploads/pdfs/${fileName}`));
    writeStream.on('error', reject);
  });
};

module.exports = {
  generatePayslipPDF,
  generateAttendanceReportPDF,
  generateGenericReportPDF,
};
