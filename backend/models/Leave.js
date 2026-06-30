/**
 * Leave Model
 * ============================================================
 * Manages leave applications, approvals, and balance tracking.
 * Workflow: Pending → HR Approved / Rejected → Manager Approved / Rejected
 */

const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    leaveType: {
      type: String,
      enum: ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Other'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    numberOfDays: {
      type: Number,
      min: [0.5, 'Minimum leave is 0.5 day'],
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDaySession: {
      type: String,
      enum: ['Morning', 'Afternoon', null],
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Leave reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },

    // ─── Document Upload (Medical Cert, etc.) ──────────────────
    document: {
      name: String,
      url: String,
      uploadedAt: Date,
    },

    // ─── HR Approval ────────────────────────────────────────────
    hrStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    hrReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    hrReviewedAt: {
      type: Date,
      default: null,
    },
    hrComment: {
      type: String,
      trim: true,
    },

    // ─── Manager Review ─────────────────────────────────────────
    managerStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Not Required'],
      default: 'Pending',
    },
    managerReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    managerReviewedAt: {
      type: Date,
      default: null,
    },
    managerComment: {
      type: String,
      trim: true,
    },

    // ─── Final Status ───────────────────────────────────────────
    // Approved only if BOTH HR and Manager approve
    finalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-Save: Calculate number of days ───────────────────────────────────────
LeaveSchema.pre('save', function (next) {
  if (this.isHalfDay) {
    this.numberOfDays = 0.5;
  } else if (this.startDate && this.endDate) {
    const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.numberOfDays = diffDays;
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
LeaveSchema.index({ employee: 1, finalStatus: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', LeaveSchema);
