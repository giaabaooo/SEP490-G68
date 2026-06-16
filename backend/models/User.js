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

    companySize: {
      type: String,
      default: "",
    },

    address: {
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