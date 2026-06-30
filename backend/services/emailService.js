/**
 * Email Service - Nodemailer
 * ============================================================
 * Handles all email notifications for the EMS:
 * - Welcome email on registration
 * - Leave approval/rejection notifications
 * - Payslip notifications
 * - Task assignment notifications
 * - Password reset emails
 * - Email verification
 */

const nodemailer = require('nodemailer');

// ─── Create Transporter ────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── Base Email Template ───────────────────────────────────────────────────────
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f6fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1E3A5F 0%, #2980B9 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 30px 35px; color: #34495E; line-height: 1.7; }
    .body h2 { color: #1E3A5F; font-size: 18px; margin-top: 0; }
    .info-box { background: #F8F9FA; border-left: 4px solid #2ECC71; border-radius: 4px; padding: 15px 20px; margin: 20px 0; }
    .info-box.danger { border-left-color: #E74C3C; }
    .info-box.warning { border-left-color: #F39C12; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge.success { background: #E8F8F5; color: #27AE60; }
    .badge.danger { background: #FDEDEC; color: #E74C3C; }
    .btn { display: inline-block; margin: 20px 0; padding: 12px 30px; background: #1E3A5F; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
    .footer { background: #ECF0F1; padding: 20px; text-align: center; font-size: 12px; color: #7F8C8D; }
    .divider { border: none; border-top: 1px solid #ECF0F1; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 10px; text-align: left; border-bottom: 1px solid #ECF0F1; font-size: 13px; }
    th { background: #F2F3F4; font-weight: 600; color: #1E3A5F; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 Smart Employee Management System</h1>
      <p>${title}</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Smart EMS. This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Email Helper ─────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Smart EMS <noreply@smartems.com>',
      to,
      subject,
      html,
      text: text || 'Please view this email in an HTML-compatible mail client.',
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Don't throw - email failures shouldn't crash the API
    return { success: false, error: error.message };
  }
};

// ─── Email Templates ───────────────────────────────────────────────────────────

/**
 * Welcome Email - sent on successful registration
 */
const sendWelcomeEmail = async (employee, temporaryPassword = null) => {
  const content = `
    <h2>Welcome, ${employee.firstName}! 👋</h2>
    <p>Your account has been created on the Smart Employee Management System.</p>
    <div class="info-box">
      <table>
        <tr><th>Employee ID</th><td>${employee.employeeId}</td></tr>
        <tr><th>Email</th><td>${employee.email}</td></tr>
        <tr><th>Role</th><td>${employee.role}</td></tr>
        <tr><th>Department</th><td>${employee.department}</td></tr>
      </table>
    </div>
    ${temporaryPassword ? `<p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p><p>Please change your password after your first login.</p>` : ''}
    <p>You can log in at: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
  `;
  return sendEmail({
    to: employee.email,
    subject: '🎉 Welcome to Smart EMS - Your Account is Ready',
    html: baseTemplate(content, 'Account Created Successfully'),
  });
};

/**
 * Leave Status Email - sent when leave is approved or rejected
 */
const sendLeaveStatusEmail = async (employee, leaveRequest, status, comment = '') => {
  const isApproved = status === 'Approved';
  const content = `
    <h2>Leave Request ${status}</h2>
    <p>Hi ${employee.firstName}, your leave request has been <span class="badge ${isApproved ? 'success' : 'danger'}">${status}</span>.</p>
    <div class="info-box ${!isApproved ? 'danger' : ''}">
      <table>
        <tr><th>Leave Type</th><td>${leaveRequest.leaveType}</td></tr>
        <tr><th>From</th><td>${new Date(leaveRequest.startDate).toLocaleDateString()}</td></tr>
        <tr><th>To</th><td>${new Date(leaveRequest.endDate).toLocaleDateString()}</td></tr>
        <tr><th>Days</th><td>${leaveRequest.numberOfDays}</td></tr>
        <tr><th>Reason</th><td>${leaveRequest.reason}</td></tr>
      </table>
    </div>
    ${comment ? `<p><strong>Review Comment:</strong> ${comment}</p>` : ''}
  `;
  return sendEmail({
    to: employee.email,
    subject: `Leave Request ${status} - Smart EMS`,
    html: baseTemplate(content, `Leave Request ${status}`),
  });
};

/**
 * Task Assignment Email - sent when a task is assigned
 */
const sendTaskAssignmentEmail = async (employee, task) => {
  const content = `
    <h2>New Task Assigned 📋</h2>
    <p>Hi ${employee.firstName}, you have been assigned a new task.</p>
    <div class="info-box">
      <table>
        <tr><th>Task Title</th><td>${task.title}</td></tr>
        <tr><th>Priority</th><td>${task.priority}</td></tr>
        <tr><th>Due Date</th><td>${new Date(task.dueDate).toLocaleDateString()}</td></tr>
        <tr><th>Description</th><td>${task.description || 'N/A'}</td></tr>
      </table>
    </div>
    <p>Please log in to view full task details and start working on it.</p>
  `;
  return sendEmail({
    to: employee.email,
    subject: `📋 New Task Assigned: ${task.title}`,
    html: baseTemplate(content, 'Task Assignment Notification'),
  });
};

/**
 * Payslip Generated Email - notifies employee when payslip is ready
 */
const sendPayslipNotificationEmail = async (employee, payroll) => {
  const content = `
    <h2>Your Payslip is Ready 💰</h2>
    <p>Hi ${employee.firstName}, your payslip for <strong>${payroll.payPeriodLabel}</strong> has been generated.</p>
    <div class="info-box">
      <table>
        <tr><th>Pay Period</th><td>${payroll.payPeriodLabel}</td></tr>
        <tr><th>Gross Salary</th><td>$${payroll.grossSalary.toFixed(2)}</td></tr>
        <tr><th>Total Deductions</th><td>$${payroll.totalDeductions.toFixed(2)}</td></tr>
        <tr><th>Net Salary</th><td><strong>$${payroll.netSalary.toFixed(2)}</strong></td></tr>
        <tr><th>Status</th><td>${payroll.status}</td></tr>
      </table>
    </div>
    <p>Log in to your dashboard to download your payslip PDF.</p>
  `;
  return sendEmail({
    to: employee.email,
    subject: `💰 Payslip Ready for ${payroll.payPeriodLabel}`,
    html: baseTemplate(content, 'Payslip Notification'),
  });
};

/**
 * Password Reset Email
 * @param {Object} employee - Employee document
 * @param {String} resetUrl - Full URL with reset token (built by authController)
 */
const sendPasswordResetEmail = async (employee, resetUrl) => {
  const content = `
    <h2>Password Reset Request 🔐</h2>
    <p>Hi ${employee.firstName}, we received a request to reset your password.</p>
    <p>Click the button below to reset your password. This link is valid for <strong>30 minutes</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>If you did not request this, please ignore this email — your password will remain unchanged.</p>
    <div class="info-box warning">
      <p>⚠️ For security, never share this link with anyone.</p>
    </div>
  `;
  return sendEmail({
    to: employee.email,
    subject: '🔐 Password Reset Request - Smart EMS',
    html: baseTemplate(content, 'Password Reset'),
  });
};

/**
 * Email Verification Email
 * @param {Object} employee - Employee document
 * @param {String} verifyUrl - Full URL with verification token (built by authController)
 */
const sendVerificationEmail = async (employee, verifyUrl) => {
  const content = `
    <h2>Verify Your Email Address ✅</h2>
    <p>Hi ${employee.firstName}, please confirm your email address to activate all features of your account.</p>
    <p>Click the button below to verify your email. This link is valid for <strong>24 hours</strong>.</p>
    <a href="${verifyUrl}" class="btn">Verify Email</a>
    <p>If you did not create this account, please ignore this email.</p>
  `;
  return sendEmail({
    to: employee.email,
    subject: '✅ Verify Your Email - Smart EMS',
    html: baseTemplate(content, 'Email Verification'),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLeaveStatusEmail,
  sendTaskAssignmentEmail,
  sendPayslipNotificationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
};