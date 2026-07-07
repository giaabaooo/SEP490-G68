// models/CV.js
const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'CV Chưa Đặt Tên' },
  templateType: { type: String, default: 'standard' },
  isActive: { type: Boolean, default: false }, // Cho phép NTD tìm kiếm không
  design: {
    font: { type: String, default: 'Times New Roman' },
    color: { type: String, default: '#059669' },
    lineSpacing: { type: Number, default: 1.5 }
  },
  data: {
    personal: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: String,
      link: String, // Github, Portfolio...
      jobTitle: String
    },
    objective: String,
    education: [{
      school: String,
      major: String,
      time: String,
      description: String
    }],
    experience: [{
      company: String,
      position: String,
      time: String,
      description: String
    }],
    skills: [String],
    projects: [{
      name: String,
      time: String,
      role: String,
      description: String,
      link: String
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('CV', cvSchema);