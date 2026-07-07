const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    appliedCvId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    aiScore: {
      type: Number,
      default: 0,
    },
    aiReason: {
      type: String,
      default: '',
    },
    hrAdjustedScore: {
      type: Number,
      default: null,
    },
    isPassedScreening: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'],
      default: 'Applied',
    },
    mailSentStatus: {
      type: String,
      enum: ['Pending', 'Sent_Pass', 'Sent_Reject'],
      default: 'Pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Application', applicationSchema);
