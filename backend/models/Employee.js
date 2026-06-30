/**
 * Employee Model
 * ============================================================
 * Core entity representing all users in the system.
 * Roles: Admin | HR | Manager | Employee
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema(
  {
    // ─── Identity ─────────────────────────────────────────────
    employeeId: {
      type: String,
      unique: true,
      // Auto-generated via pre-save hook using generateEmployeeId utility
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Invalid phone number'],
    },
    avatar: {
      type: String,
      default: null,
    },

    // ─── Role & Access ─────────────────────────────────────────
    role: {
      type: String,
      enum: ['Admin', 'HR', 'Manager', 'Employee'],
      default: 'Employee',
    },

    // ─── Employment Details ────────────────────────────────────
    department: {
      type: String,
      trim: true,
      enum: [
        'Engineering',
        'Human Resources',
        'Finance',
        'Marketing',
        'Sales',
        'Operations',
        'Design',
        'Legal',
        'Management',
        'Other',
      ],
      default: 'Other',
    },
    designation: {
      type: String,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
      default: 'Full-Time',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On-Leave', 'Terminated'],
      default: 'Active',
    },

    // ─── Reporting Structure ───────────────────────────────────
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    // ─── Salary Info ───────────────────────────────────────────
    basicSalary: {
      type: Number,
      default: 0,
      min: [0, 'Salary cannot be negative'],
    },

    // ─── Address ───────────────────────────────────────────────
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    // ─── Documents (uploaded via Multer) ──────────────────────
    documents: [
      {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Session Tracking ──────────────────────────────────────
    lastLogin: {
      type: Date,
      default: null,
    },
    currentSession: {
      sessionId: { type: String, default: null },
      startTime: { type: Date, default: null },
      isActive: { type: Boolean, default: false },
    },

    // ─── Leave Balance ─────────────────────────────────────────
    leaveBalance: {
      annual: { type: Number, default: 15 },
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 7 },
      maternity: { type: Number, default: 90 },
      paternity: { type: Number, default: 15 },
      unpaid: { type: Number, default: 0 },
    },

    // ─── Password Reset ────────────────────────────────────────
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Full Name ────────────────────────────────────────────────────────
EmployeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Pre-Save: Hash Password ───────────────────────────────────────────────────
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Pre-Save: Auto-generate Employee ID ──────────────────────────────────────
EmployeeSchema.pre('save', async function (next) {
  if (!this.isNew || this.employeeId) return next();
  const { generateEmployeeId } = require('../utils/generateEmployeeId');
  this.employeeId = await generateEmployeeId();
  next();
});

// ─── Instance Method: Compare Password ────────────────────────────────────────
EmployeeSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Index for fast querying ───────────────────────────────────────────────────
// email and employeeId indexes are already created via unique:true in schema
EmployeeSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Employee', EmployeeSchema);
