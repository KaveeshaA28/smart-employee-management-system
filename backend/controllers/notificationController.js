/**
 * Notification Controller
 * ============================================================
 * Manages in-app notifications for the EMS.
 * Triggers: Leave status, Task assignment, Payslip ready, etc.
 */

const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Task = require('../models/Task');
const Payroll = require('../models/Payroll');
const { sendEmail } = require('../services/emailService');

/**
 * @desc    Get all notifications for the current user
 * @route   GET /api/notifications
 * @access  Private
 *
 * This is a smart endpoint that dynamically builds notification-like data
 * from various sources (leave status changes, task assignments, etc.)
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const notifications = [];

    if (userRole === 'Employee') {
      // 1. My pending leave requests
      const pendingLeaves = await Leave.find({ employee: userId, finalStatus: 'Pending' })
        .select('leaveType startDate endDate hrStatus createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      pendingLeaves.forEach((l) => {
        notifications.push({
          id: `leave_${l._id}`,
          type: 'leave',
          title: 'Leave Request Pending',
          message: `Your ${l.leaveType} leave (${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}) is awaiting HR approval.`,
          status: 'info',
          createdAt: l.createdAt,
          link: `/leave/${l._id}`,
        });
      });

      // 2. Recently approved/rejected leaves
      const recentLeaves = await Leave.find({
        employee: userId,
        finalStatus: { $in: ['Approved', 'Rejected'] },
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).limit(3);

      recentLeaves.forEach((l) => {
        notifications.push({
          id: `leave_status_${l._id}`,
          type: 'leave',
          title: `Leave Request ${l.finalStatus}`,
          message: `Your ${l.leaveType} leave has been ${l.finalStatus}.`,
          status: l.finalStatus === 'Approved' ? 'success' : 'danger',
          createdAt: l.updatedAt,
          link: `/leave/${l._id}`,
        });
      });

      // 3. My assigned tasks (new/overdue)
      const myTasks = await Task.find({
        assignedTo: userId,
        isDeleted: false,
        status: { $ne: 'Completed' },
      }).select('title priority dueDate status createdAt').sort({ createdAt: -1 }).limit(5);

      myTasks.forEach((t) => {
        const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'Completed';
        notifications.push({
          id: `task_${t._id}`,
          type: 'task',
          title: isOverdue ? '⚠️ Overdue Task' : 'Task Assigned',
          message: `"${t.title}" - Priority: ${t.priority} | Due: ${new Date(t.dueDate).toLocaleDateString()}`,
          status: isOverdue ? 'danger' : 'info',
          createdAt: t.createdAt,
          link: `/tasks/${t._id}`,
        });
      });

      // 4. Recent payslips
      const payslips = await Payroll.find({
        employee: userId,
        status: { $in: ['Generated', 'Paid'] },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }).sort({ createdAt: -1 }).limit(2);

      payslips.forEach((p) => {
        notifications.push({
          id: `payroll_${p._id}`,
          type: 'payroll',
          title: 'Payslip Available',
          message: `Your payslip for ${p.payPeriodLabel} is ready. Net: $${p.netSalary.toFixed(2)}`,
          status: 'success',
          createdAt: p.createdAt,
          link: `/payroll/${p._id}`,
        });
      });
    }

    if (['Admin', 'HR'].includes(userRole)) {
      // 1. Pending leave approvals
      const pendingLeaves = await Leave.find({ hrStatus: 'Pending', finalStatus: 'Pending' })
        .populate('employee', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

      pendingLeaves.forEach((l) => {
        notifications.push({
          id: `hr_leave_${l._id}`,
          type: 'leave_approval',
          title: '📋 Leave Approval Required',
          message: `${l.employee.firstName} ${l.employee.lastName} applied for ${l.leaveType} leave (${l.numberOfDays} day(s)).`,
          status: 'warning',
          createdAt: l.createdAt,
          link: `/leave/${l._id}`,
        });
      });
    }

    if (['Manager', 'Admin'].includes(userRole)) {
      // Pending manager reviews
      const pendingManagerLeaves = await Leave.find({ hrStatus: 'Approved', managerStatus: 'Pending' })
        .populate('employee', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5);

      pendingManagerLeaves.forEach((l) => {
        notifications.push({
          id: `mgr_leave_${l._id}`,
          type: 'leave_review',
          title: '✅ Manager Review Required',
          message: `${l.employee.firstName} ${l.employee.lastName}'s leave needs your approval.`,
          status: 'warning',
          createdAt: l.createdAt,
          link: `/leave/${l._id}`,
        });
      });
    }

    // Sort by date
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications.slice(0, 20), // Return latest 20
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send manual email notification (Admin only)
 * @route   POST /api/notifications/send-email
 * @access  Private - Admin
 */
const sendManualEmail = async (req, res, next) => {
  try {
    const { recipientIds, subject, message } = req.body;

    if (!recipientIds?.length || !subject || !message) {
      return res.status(400).json({ success: false, message: 'recipientIds, subject, and message are required.' });
    }

    const employees = await Employee.find({ _id: { $in: recipientIds }, isDeleted: false });

    const results = await Promise.allSettled(
      employees.map((emp) =>
        sendEmail({
          to: emp.email,
          subject,
          html: `<div style="font-family:Arial,sans-serif;padding:20px"><h2>${subject}</h2><p>${message}</p><hr/><small>Smart EMS</small></div>`,
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.status(200).json({
      success: true,
      message: `Email sent to ${sent} recipient(s). Failed: ${failed}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, sendManualEmail };
