/**
 * Task Model
 * ============================================================
 * Manages tasks assigned to employees with status workflow:
 * To Do → In Progress → Review → Completed
 */

const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    // ─── Assignment ─────────────────────────────────────────────
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Task must be assigned to an employee'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Assigner is required'],
    },

    // ─── Status Workflow ────────────────────────────────────────
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed', 'Cancelled'],
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },

    // ─── Dates ─────────────────────────────────────────────────
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // ─── Progress ──────────────────────────────────────────────
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ─── Category / Tags ───────────────────────────────────────
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    tags: [{ type: String, trim: true }],

    // ─── Comments ──────────────────────────────────────────────
    comments: [CommentSchema],

    // ─── Attachments ───────────────────────────────────────────
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-Save: Set completedAt when status becomes Completed ─────────────────
TaskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ assignedBy: 1 });

module.exports = mongoose.model('Task', TaskSchema);
