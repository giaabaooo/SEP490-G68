const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // CHỈ yêu cầu password nếu KHÔNG phải login Google
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
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

    googleId: {
      type: String,
      default: "",
    },

    companyName: {
      type: String,
      default: "",
    },

    taxCode: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    companySize: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    title: {
      type: String,
      default: "",
    },

    aboutMe: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

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

    cvUrl: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);