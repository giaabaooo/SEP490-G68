// File: backend/models/CVReview.js
const mongoose = require('mongoose');

const cvReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  score: { type: Number, required: true },
  verdict: { type: String },
  pros: { type: [String], default: [] },
  cons: { type: [String], default: [] },
  advice: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CVReview', cvReviewSchema);