const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requirements: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    type: { type: String, default: "Full-time", trim: true },
    experience: { type: String, default: "Không yêu cầu kinh nghiệm", trim: true },
    salary: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "draft", "closed"],
      default: "active",
    },
    recruitmentDeadline: { type: Date, default: null },
    vacancies: { type: Number, default: 1 }, // Số lượng cần tuyển
    useAiReview: { type: Boolean, default: true }, // Tùy chọn bật/tắt AI chấm CV
    requirementCategories: [{
      name: { type: String, required: true }, // Tên tiêu chí (VD: Frontend, Giao tiếp)
      weight: { type: Number, required: true }, // Trọng số (%)
      isKey: { type: Boolean, default: false } // Có phải tiêu chí trọng điểm không
    }],
    // ==========================================
    // LUỒNG MODERATOR & KHOÁN TOKEN
    // ==========================================
    requireTest: { type: Boolean, default: false },
    moderatorEmail: { type: String, default: "", trim: true, lowercase: true },
    testStatus: { type: String, enum: ["pending", "approved", null], default: null },
    aiTokensQuota: { type: Number, default: 0 } // Thêm trường Hạn mức Token nội bộ
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);