const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true
    },

    otp: {
      type: String,
      required: true
    },

    // lưu tạm thông tin đăng ký
    data: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// tự xóa sau 5 phút
otpSchema.index(
  {
    createdAt: 1
  },
  {
    expireAfterSeconds:
      300
  }
);

module.exports =
  mongoose.model(
    "Otp",
    otpSchema
  );