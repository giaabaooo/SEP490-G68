const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, default: 'mcq' }, // Ép mặc định là MCQ
  skill: { type: String, default: 'General' },
  question: { type: String, required: true },
  options: [String], 
  correctAnswer: { type: Number },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'audio', 'none'], default: 'none' }
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Gắn với Job nào
  assessmentName: { type: String, required: true, trim: true },
  timeLimit: { type: Number, required: true },
  tags: [String], 
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
  isPublic: { type: Boolean, default: false },
  startDate: { type: Date },
  endDate: { type: Date },
  description: { type: String },
  questions: [questionSchema] 
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);