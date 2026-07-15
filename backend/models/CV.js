// models/CV.js
const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'CV Chưa Đặt Tên' },
  templateType: { type: String, default: 'standard' },
  isActive: { type: Boolean, default: false },
  design: {
    font: { type: String, default: 'Roboto' },
    color: { type: String, default: '#059669' },
    lineSpacing: { type: Number, default: 1.5 }
  },
  data: {
    personal: {
      fullName: { type: String, required: true },
      jobTitle: String,
      email: { type: String, required: true },
      phone: String,
      dob: String,       // Ngày sinh
      gender: String,    // Giới tính
      address: String,
      link: String,
      avatar: String     // Lưu ảnh dưới dạng Base64 hoặc URL
    },
    // Cho phép người dùng đổi tên các thẻ Heading (VD: "Học vấn" -> "Quá trình đào tạo")
    sectionTitles: {
      objective: { type: String, default: 'Mục tiêu nghề nghiệp' },
      education: { type: String, default: 'Học vấn' },
      experience: { type: String, default: 'Kinh nghiệm làm việc' },
      activities: { type: String, default: 'Hoạt động' },
      certificates: { type: String, default: 'Chứng chỉ' },
      skills: { type: String, default: 'Kỹ năng chuyên môn' },
      hobbies: { type: String, default: 'Sở thích' }
    },
    objective: String,
    education: [{ school: String, major: String, time: String, description: String }],
    experience: [{ company: String, position: String, time: String, description: String }],
    activities: [{ organization: String, role: String, time: String, description: String }],
    certificates: [{ name: String, time: String }],
    skills: String,
    hobbies: String
  }
}, { timestamps: true });

module.exports = mongoose.model('CV', cvSchema);