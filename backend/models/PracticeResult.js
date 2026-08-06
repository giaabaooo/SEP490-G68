// File: backend/models/PracticeResult.js
const mongoose = require('mongoose');

const practiceResultSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  practiceTopicId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PracticeTopic', 
    required: true 
  },
  score: { type: Number, required: true },
  answers: { type: Object, required: true },
  duration: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PracticeResult', practiceResultSchema);