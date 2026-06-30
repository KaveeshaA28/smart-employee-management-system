/**
 * Performance Model
 * ============================================================
 * Employee performance evaluation records.
 *
 * Formula:
 * Overall Score = (Attendance Score + Task Completion Rate + Quality Score) / 3
 * Each score is out of 100.
 */

const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Reviewer reference is required'],
    },

    // ─── Review Period ─────────────────────────────────────────
    reviewPeriod: {
      month: { type: Number, min: 1, max: 12 },
      year: { type: Number },
      label: { type: String }, // e.g. "June 2024"
      type: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Annual'],
        default: 'Monthly',
      },
    },

    // ─── KPI Scores (0–100 each) ───────────────────────────────
    scores: {
      attendance: {
        type: Number,
        min: 0,
        max: 100,
        required: [true, 'Attendance score is required'],
      },
      taskCompletion: {
        type: Number,
        min: 0,
        max: 100,
        required: [true, 'Task completion score is required'],
      },
      qualityOfWork: {
        type: Number,
        min: 0,
        max: 100,
        required: [true, 'Quality of work score is required'],
      },
      // Optional additional KPIs
      communication: { type: Number, min: 0, max: 100, default: null },
      teamwork: { type: Number, min: 0, max: 100, default: null },
      leadership: { type: Number, min: 0, max: 100, default: null },
    },

    // ─── Overall Score (Auto-calculated) ──────────────────────
    // = (attendance + taskCompletion + qualityOfWork) / 3
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // ─── Rating based on Overall Score ─────────────────────────
    // 90-100: Excellent, 75-89: Good, 60-74: Satisfactory, <60: Needs Improvement
    rating: {
      type: String,
      enum: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'],
    },

    // ─── Manager Feedback ──────────────────────────────────────
    strengths: {
      type: String,
      trim: true,
      maxlength: [2000, 'Strengths cannot exceed 2000 characters'],
    },
    areasForImprovement: {
      type: String,
      trim: true,
      maxlength: [2000, 'Areas for improvement cannot exceed 2000 characters'],
    },
    goals: {
      type: String,
      trim: true,
      maxlength: [2000, 'Goals cannot exceed 2000 characters'],
    },
    managerComments: {
      type: String,
      trim: true,
      maxlength: [3000, 'Comments cannot exceed 3000 characters'],
    },

    // ─── Employee Acknowledgement ──────────────────────────────
    employeeAcknowledged: {
      type: Boolean,
      default: false,
    },
    employeeComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Employee comments cannot exceed 2000 characters'],
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Acknowledged'],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-Save: Auto-calculate overall score and rating ────────────────────────
PerformanceSchema.pre('save', function (next) {
  const { attendance, taskCompletion, qualityOfWork } = this.scores;

  if (attendance != null && taskCompletion != null && qualityOfWork != null) {
    this.overallScore = parseFloat(((attendance + taskCompletion + qualityOfWork) / 3).toFixed(2));

    // Assign rating
    if (this.overallScore >= 90) this.rating = 'Excellent';
    else if (this.overallScore >= 75) this.rating = 'Good';
    else if (this.overallScore >= 60) this.rating = 'Satisfactory';
    else this.rating = 'Needs Improvement';
  }

  // Set period label
  if (this.reviewPeriod.month && this.reviewPeriod.year) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.reviewPeriod.label = `${monthNames[this.reviewPeriod.month - 1]} ${this.reviewPeriod.year}`;
  }

  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
PerformanceSchema.index({ employee: 1, 'reviewPeriod.year': 1, 'reviewPeriod.month': 1 });

module.exports = mongoose.model('Performance', PerformanceSchema);
