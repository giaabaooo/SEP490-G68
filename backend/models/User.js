// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: {
      type: String,
      required: function () { return !this.googleId; },
      default: undefined,
    },
    role: {
      type: String,
      enum: ["admin", "candidate", "business"],
      default: "candidate",
    },
    subRole: {
      type: String,
      enum: ["admin", "hr", "moderator"],
      default: "hr",
    },
    status: {
      type: String,
      enum: ["active", "banned", "pending"],
      default: "pending",
    },
    googleId: { type: String, default: "" },
    companyName: { type: String, default: "" },
    taxCode: { type: String, default: "" },
    city: { type: String, default: "" },
    website: { type: String, default: "" },
    companySize: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    title: { type: String, default: "" },
    aboutMe: { type: String, default: "" },
    skills: { type: [String], default: [] },
    experience: [
      {
        company: { type: String, default: "" },
        role: { type: String, default: "" },
        startDate: { type: String, default: "" },
        endDate: { type: String, default: "" },
        current: { type: Boolean, default: false },
        description: { type: String, default: "" },
      },
    ],
    education: [
      {
        school: { type: String, default: "" },
        degree: { type: String, default: "" },
        major: { type: String, default: "" },
        startDate: { type: String, default: "" },
        endDate: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    cvUrl: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },

    // ================= DÀNH CHO THANH TOÁN & QUẢN LÝ TÍNH NĂNG AI =================
    // Dành cho Candidate (Gói đăng ký có thời hạn)
    subscription: {
      plan: { type: String, enum: ["free", "pro"], default: "free" },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      usage: {
        cvReviewCount: { type: Number, default: 0 },
        mockInterviewMinutes: { type: Number, default: 0 },
        roadmapCount: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now },
      },
    },

    // Dành cho Business (Hệ thống Token/Credit)
    businessCredits: {
      balance: { type: Number, default: 100 }, // Mặc định tặng 100 Token trải nghiệm
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);