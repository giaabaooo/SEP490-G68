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

    // ==========================================
    // THÊM 3 TRƯỜNG NÀY ĐỂ PHỤC VỤ LUỒNG MODERATOR
    // ==========================================
    requireTest: { type: Boolean, default: false },
    moderatorEmail: { type: String, default: "", trim: true, lowercase: true },
    testStatus: { 
      type: String, 
      enum: ["pending", "approved", null], 
      default: null 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);