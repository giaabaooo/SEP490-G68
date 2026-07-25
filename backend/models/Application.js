// File: backend/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appliedCvId: { type: mongoose.Schema.Types.ObjectId, default: null },
  appliedCvFileUrl: { type: String, default: '' },
  
  // Các trường do AI đánh giá (Chấm CV)
  aiScore: { type: Number, default: 0 },
  aiMatchDetails: {
    matched: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    advice: { type: String, default: '' }
  },
  
  // Đánh dấu job này có bài test để lưu trạng thái
  hasTest: { type: Boolean, default: false },

  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', default: null },
  testStatus: { type: String, enum: ['Not_Started', 'In_Progress', 'Completed'], default: 'Not_Started' },
  testScore: { type: Number, default: null }, // Điểm bài test (0 - 100)
  testAnswers: { type: mongoose.Schema.Types.Mixed, default: {} }, // Lưu đáp án ứng viên (VD: { "0": 1, "1": 3 })
  testStartedAt: { type: Date, default: null }, // Thời gian bắt đầu làm
  testSubmittedAt: { type: Date, default: null }, // Thời gian nộp bài
  testDuration: { type: Number, default: 0 }, // Thời lượng làm bài (tính bằng giây)
  // ==========================================
  
  hrAdjustedScore: { type: Number, default: null },
  isPassedScreening: { type: Boolean, default: false },
  status: { type: String, enum: ['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'], default: 'Applied' },
  mailSentStatus: { type: String, enum: ['Pending', 'Sent_Pass', 'Sent_Reject'], default: 'Pending' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);