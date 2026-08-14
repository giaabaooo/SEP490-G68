// controllers/payment.controller.js
const PayOS = require('@payos/node');
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// Khai báo Key dự phòng. Nếu file .env lỗi, hệ thống vẫn dùng Key này để chạy.
const CLIENT_ID = process.env.PAYOS_CLIENT_ID || "fed8fcd9-c101-475b-a168-c6fd357a04c2";
const API_KEY = process.env.PAYOS_API_KEY || "79255c09-107a-4fb4-a4a2-41499132fa14";
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || "ff824e14c8657f3d1a04378b32ad94f6c865c6cea78f9a56893228116a9b9828";

// Khởi tạo SDK PayOS duy nhất 1 lần (Bản 1.0.10 hoạt động hoàn hảo với cú pháp này)
const payos = new PayOS(CLIENT_ID, API_KEY, CHECKSUM_KEY);

// 1. Tạo Link Thanh Toán
exports.createPaymentLink = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { planType, amount, tokens } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });

    // Tạo orderCode ngẫu nhiên dạng số (Yêu cầu bắt buộc của PayOS)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 899 + 100));
    
    let description = planType === "CANDIDATE_PRO" ? "Nang cap Pro" : `Nap ${tokens || 0} Token`;

    const returnUrl = `http://localhost:5173/payment/success?orderCode=${orderCode}`;
    const cancelUrl = `http://localhost:5173/upgrade`;

    const body = {
      orderCode,
      amount: Number(amount),
      description: description.substring(0, 25), // PayOS giới hạn độ dài description 25 ký tự
      items: [
        {
          name: planType === "CANDIDATE_PRO" ? "Goi Pro Candidate" : `Goi ${tokens} Token AI`,
          quantity: 1,
          price: Number(amount),
        },
      ],
      returnUrl,
      cancelUrl,
    };

    // Hàm này sẽ hoạt động bình thường trên bản 1.0.10
    const paymentLinkData = await payos.createPaymentLink(body);

    // Lưu giao dịch chờ xử lý vào Database
    await Transaction.create({
      userId,
      orderCode,
      amount: Number(amount),
      description,
      planType,
      tokensAdded: tokens || 0,
      paymentLinkId: paymentLinkData.paymentLinkId,
      status: "PENDING",
    });

    return res.json({ checkoutUrl: paymentLinkData.checkoutUrl });
  } catch (error) {
    console.error("Lỗi tạo thanh toán PayOS:", error);
    return res.status(500).json({ message: "Không thể tạo liên kết thanh toán: " + error.message });
  }
};

// 2. Webhook / Callback xử lý khi PayOS chuyển khoản thành công
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = payos.verifyPaymentWebhookData(req.body);

    if (webhookData && webhookData.code === "00") {
      const orderCode = webhookData.orderCode;
      const transaction = await Transaction.findOne({ orderCode });

      if (transaction && transaction.status === "PENDING") {
        transaction.status = "PAID";
        await transaction.save();

        const user = await User.findById(transaction.userId);
        if (user) {
          if (transaction.planType === "CANDIDATE_PRO") {
            const now = new Date();
            const endDate = new Date();
            endDate.setDate(now.getDate() + 30); // Cấp quyền 30 ngày

            user.subscription.plan = "pro";
            user.subscription.startDate = now;
            user.subscription.endDate = endDate;
            user.subscription.usage.cvReviewCount = 0;
            user.subscription.usage.mockInterviewMinutes = 0;
            user.subscription.usage.roadmapCount = 0;
            user.subscription.usage.lastResetDate = now;
          } else if (transaction.planType === "BUSINESS_TOPUP") {
            user.businessCredits.balance += transaction.tokensAdded;
          }
          await user.save();
        }
      }
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Lỗi Webhook PayOS:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 3. Kiểm tra trạng thái và kích hoạt gói ngay sau khi Redirect về Frontend
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.query;
    const transaction = await Transaction.findOne({ orderCode: Number(orderCode) });

    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    if (transaction.status === "PAID") {
      return res.json({ status: "PAID", message: "Giao dịch đã thanh toán thành công." });
    }

    // Double check với server PayOS nếu Webhook chưa kịp chạy
    const paymentInfo = await payos.getPaymentLinkInformation(transaction.orderCode);

    if (paymentInfo && paymentInfo.status === "PAID") {
      transaction.status = "PAID";
      await transaction.save();

      const user = await User.findById(transaction.userId);
      if (user) {
        if (transaction.planType === "CANDIDATE_PRO") {
          const now = new Date();
          const endDate = new Date();
          endDate.setDate(now.getDate() + 30);

          user.subscription.plan = "pro";
          user.subscription.startDate = now;
          user.subscription.endDate = endDate;
          user.subscription.usage = {
            cvReviewCount: 0,
            mockInterviewMinutes: 0,
            roadmapCount: 0,
            lastResetDate: now,
          };
        } else if (transaction.planType === "BUSINESS_TOPUP") {
          user.businessCredits.balance += transaction.tokensAdded;
        }
        await user.save();
      }
      return res.json({ status: "PAID", message: "Kích hoạt gói thành công!" });
    }

    return res.json({ status: transaction.status });
  } catch (error) {
    console.error("Lỗi check status:", error);
    return res.status(500).json({ message: error.message });
  }
};

// 4. Lấy thông tin gói cước / Token hiện tại của User
exports.getUserUsageInfo = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select("subscription businessCredits role");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Kiểm tra hết hạn gói Candidate Pro
    if (user.role === "candidate" && user.subscription.plan === "pro") {
      if (user.subscription.endDate && new Date() > new Date(user.subscription.endDate)) {
        user.subscription.plan = "free";
        await user.save();
      }
    }

    return res.json({
      role: user.role,
      subscription: user.subscription,
      businessCredits: user.businessCredits,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};