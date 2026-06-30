/**
 * Attendance Model
 * ============================================================
 * Tracks daily attendance records per employee.
 * Status: Present | Late | Absent | Half-Day | Holiday
 */

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent', 'Half-Day', 'Holiday', 'Weekend'],
      required: [true, 'Attendance status is required'],
    },

    // ─── Timing ────────────────────────────────────────────────
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },

    // ─── Working Hours Calculation ─────────────────────────────
    // Computed: (checkOut - checkIn) in hours
    workingHours: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number, // in hours beyond standard 8h
      default: 0,
    },

    // ─── Location (optional) ───────────────────────────────────
    checkInLocation: {
      ip: String,
      device: String,
    },

    // ─── Notes ─────────────────────────────────────────────────
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },

    // ─── Marked By ─────────────────────────────────────────────
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null, // null means self-check-in
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound index: One record per employee per day ──────────────────────────
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, status: 1 });

// ─── Pre-Save: Calculate working hours ────────────────────────────────────────
AttendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = new Date(this.checkOut) - new Date(this.checkIn);
    this.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    // Overtime = hours beyond 8h standard
    this.overtime = this.workingHours > 8 ? parseFloat((this.workingHours - 8).toFixed(2)) : 0;
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
