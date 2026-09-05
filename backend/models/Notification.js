const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['status_change', 'email_notification', 'test_invite', 'interview_invite', 'general', 'application_submitted', 'test_completed', 'payment_success', 'job_approved', 'job_rejected'],
      default: 'general'
    },
    link: {
      type: String,
      default: '',
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    relatedApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
