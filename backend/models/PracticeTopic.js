const mongoose = require('mongoose');

const practiceQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  skill: { type: String, required: true, trim: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
}, { _id: false });

const practiceTopicSchema = new mongoose.Schema({
  topicName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  timeLimit: { type: Number, default: 30 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'PUBLISHED' },
  questions: [practiceQuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('PracticeTopic', practiceTopicSchema);
