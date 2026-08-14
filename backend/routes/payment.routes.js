// routes/payment.routes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middleware/auth"); // Đảm bảo import đúng middleware verify Token JWT

router.post("/create-payment-link", authMiddleware, paymentController.createPaymentLink);
router.post("/webhook", paymentController.handleWebhook);
router.get("/check-status", authMiddleware, paymentController.checkPaymentStatus);
router.get("/my-usage", authMiddleware, paymentController.getUserUsageInfo);

module.exports = router;