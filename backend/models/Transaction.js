// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderCode: { type: Number, required: true, unique: true }, // Mã đơn hàng PayOS (kiểu Số)
    amount: { type: Number, required: true },
    description: { type: String, default: "" },
    planType: { type: String, enum: ["CANDIDATE_PRO", "BUSINESS_TOPUP"], required: true },
    tokensAdded: { type: Number, default: 0 }, // Số token cộng (nếu là Business)
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED", "FAILED"],
      default: "PENDING",
    },
    paymentLinkId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);