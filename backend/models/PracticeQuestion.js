// backend/models/PracticeQuestion.js
const mongoose = require('mongoose');

const practiceQuestionSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: [true, 'Vui lòng nhập chủ đề câu hỏi'],
    trim: true
  },
  questionText: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung câu hỏi']
  },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  explanation: {
    type: String, // Lời giải thích khi ứng viên trả lời sai (không bắt buộc)
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Nối với bảng User để biết Staff nào tạo
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('PracticeQuestion', practiceQuestionSchema);