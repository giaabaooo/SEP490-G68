// File: backend/models/Roadmap.js
const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceId: { type: String, required: true, unique: true }, // Nối với ID của Application hoặc PracticeResult
  testType: { type: String, enum: ['JOB', 'PRACTICE'], required: true },
  timeframe: { type: String }, // VD: "2 Tuần", "1 Tháng"
  goal: { type: String }, // VD: "Chuẩn bị phỏng vấn", "Nâng cao kỹ năng làm việc"
  content: { type: Object, required: true } // JSON kết quả từ AI
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);