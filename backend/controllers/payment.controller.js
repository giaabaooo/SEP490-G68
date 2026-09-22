const PayOS = require('@payos/node');
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { createNotification } = require('../utils/notificationHelper');

// Cấu hình PayOS qua biến môi trường (KHÔNG để fallback hardcode trong source)
const CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const API_KEY = process.env.PAYOS_API_KEY;
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

// Khởi tạo SDK PayOS nếu có đủ biến môi trường
let payos = null;
if (CLIENT_ID && API_KEY && CHECKSUM_KEY) {
  try {
    payos = new PayOS(CLIENT_ID, API_KEY, CHECKSUM_KEY);
  } catch (err) {
    console.error("❌ Lỗi khởi tạo PayOS SDK:", err.message);
  }
} else {
  console.warn("⚠️ Cảnh báo: Chưa cấu hình biến môi trường PayOS (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY).");
}

// 1. Tạo Link Thanh Toán
exports.createPaymentLink = async (req, res) => {
  try {
    if (!payos) {
      return res.status(500).json({ 
        message: "Hệ thống thanh toán PayOS chưa được cấu hình biến môi trường trên server." 
      });
    }

    const userId = req.user.id || req.user._id;
    const { planType, amount, tokens } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });

    // Xác thực và chuẩn hóa giá trị gói nạp server-side (Chống giả mạo số tiền/token từ phía client)
    let finalAmount = Number(amount);
    let finalTokens = 0;
    let planDescription = "";
    let itemName = "";

    if (planType === "CANDIDATE_PRO") {
      finalAmount = 59000;
      finalTokens = 0;
      planDescription = "Nang cap Pro";
      itemName = "Goi Pro Candidate";
    } else if (planType === "BUSINESS_TOPUP") {
      const allowedBusinessPackages = {
        100000: 1000,
        200000: 2200,
        500000: 6000
      };
      if (!allowedBusinessPackages[finalAmount]) {
        return res.status(400).json({ message: "Gói nạp Token Doanh nghiệp không hợp lệ." });
      }
      finalTokens = allowedBusinessPackages[finalAmount];
      planDescription = `Nap ${finalTokens} Token`;
      itemName = `Goi ${finalTokens} Token AI`;
    } else {
      return res.status(400).json({ message: "Gói dịch vụ không hợp lệ." });
    }

    // Tạo orderCode ngẫu nhiên dạng số (Yêu cầu bắt buộc của PayOS)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 899 + 100));

    // Cấu hình URL trả về linh hoạt theo môi trường (Production / Localhost)
    const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
    const returnUrl = `${frontendUrl}/payment/success?orderCode=${orderCode}`;
    const cancelUrl = `${frontendUrl}/upgrade`;

    const body = {
      orderCode,
      amount: finalAmount,
      description: planDescription.substring(0, 25), // PayOS giới hạn độ dài description 25 ký tự
      items: [
        {
          name: itemName,
          quantity: 1,
          price: finalAmount,
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
      amount: finalAmount,
      description: planDescription,
      planType,
      tokensAdded: finalTokens,
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
    if (!payos) {
      return res.status(500).json({ success: false, message: "Hệ thống PayOS chưa được cấu hình trên server." });
    }

    const webhookData = payos.verifyPaymentWebhookData(req.body);

    if (webhookData && webhookData.code === "00") {
      const orderCode = webhookData.orderCode;
      
      // FIX LỖI RACE CONDITION: Sử dụng Atomic Update
      const transaction = await Transaction.findOneAndUpdate(
        { orderCode: orderCode, status: "PENDING" }, // Điều kiện chặt chẽ: Chỉ lấy nếu đang PENDING
        { $set: { status: "PAID" } },
        { new: true }
      );

      // Nếu transaction là null, nghĩa là luồng kia (checkPaymentStatus) đã xử lý xong trước đó
      if (transaction) {
        const user = await User.findById(transaction.userId);
        if (user) {
          if (transaction.planType === "CANDIDATE_PRO") {
            const now = new Date();
            let baseDate = now;
            if (user.subscription?.plan === "pro" && user.subscription?.endDate && new Date(user.subscription.endDate) > now) {
              baseDate = new Date(user.subscription.endDate);
            }
            const endDate = new Date(baseDate);
            endDate.setDate(endDate.getDate() + 30); // Cộng dồn 30 ngày vào hạn dùng còn lại

            user.subscription.plan = "pro";
            if (!user.subscription.startDate) user.subscription.startDate = now;
            user.subscription.endDate = endDate;
            if (!user.subscription.usage) user.subscription.usage = {};
            user.subscription.usage.cvReviewCount = 0;
            user.subscription.usage.mockInterviewMinutes = 0;
            user.subscription.usage.roadmapCount = 0;
            user.subscription.usage.lastResetDate = now;
          } else if (transaction.planType === "BUSINESS_TOPUP") {
            user.businessCredits.balance += transaction.tokensAdded;
          }
          await user.save();

          // Gửi thông báo cho User
          if (transaction.planType === "CANDIDATE_PRO") {
            await createNotification({
              userId: user._id,
              title: 'Nâng cấp tài khoản Pro thành công!',
              message: 'Chúc mừng bạn đã nâng cấp gói Pro 30 ngày. Bạn có 180 phút phỏng vấn AI và 50 lượt Review CV!',
              type: 'payment_success',
              link: '/upgrade'
            });
          } else if (transaction.planType === "BUSINESS_TOPUP") {
            await createNotification({
              userId: user._id,
              title: 'Nạp Token thành công!',
              message: `Bạn đã nạp thành công ${transaction.tokensAdded} Token vào tài khoản Doanh nghiệp.`,
              type: 'payment_success',
              link: '/bussiness/dashboard'
            });
          }
        }
      }
    }
    // Dù thành công hay bị trùng lặp, vẫn phải phản hồi 200 OK cho PayOS để họ ngừng gửi lại Webhook
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
    
    // Check trạng thái hiện tại (chưa update)
    const currentTx = await Transaction.findOne({ orderCode: Number(orderCode) });

    if (!currentTx) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    }

    if (currentTx.status === "PAID") {
      return res.json({ status: "PAID", message: "Giao dịch đã thanh toán thành công." });
    }

    if (!payos) {
      return res.status(500).json({ message: "Hệ thống PayOS chưa được cấu hình trên server." });
    }

    // Double check với server PayOS nếu Webhook chưa kịp chạy
    const paymentInfo = await payos.getPaymentLinkInformation(currentTx.orderCode);

    if (paymentInfo && paymentInfo.status === "PAID") {
      // FIX LỖI RACE CONDITION: Tiếp tục sử dụng Atomic Update ở đây
      const transaction = await Transaction.findOneAndUpdate(
        { orderCode: Number(orderCode), status: "PENDING" },
        { $set: { status: "PAID" } },
        { new: true }
      );

      // Nếu transaction bị null ở đây, tức là hàm handleWebhook đã chạy xong và đổi trạng thái rồi
      if (!transaction) {
        return res.json({ status: "PAID", message: "Giao dịch đã được xử lý bởi Webhook." });
      }

      // Nếu chiếm quyền cập nhật thành công, tiến hành cộng Token/Kích hoạt gói
      const user = await User.findById(transaction.userId);
      if (user) {
        if (transaction.planType === "CANDIDATE_PRO") {
          const now = new Date();
          let baseDate = now;
          if (user.subscription?.plan === "pro" && user.subscription?.endDate && new Date(user.subscription.endDate) > now) {
            baseDate = new Date(user.subscription.endDate);
          }
          const endDate = new Date(baseDate);
          endDate.setDate(endDate.getDate() + 30); // Cộng dồn 30 ngày vào hạn dùng còn lại

          user.subscription.plan = "pro";
          if (!user.subscription.startDate) user.subscription.startDate = now;
          user.subscription.endDate = endDate;
          if (!user.subscription.usage) user.subscription.usage = {};
          user.subscription.usage.cvReviewCount = 0;
          user.subscription.usage.mockInterviewMinutes = 0;
          user.subscription.usage.roadmapCount = 0;
          user.subscription.usage.lastResetDate = now;
        } else if (transaction.planType === "BUSINESS_TOPUP") {
          user.businessCredits.balance += transaction.tokensAdded;
        }
        await user.save();

        // Gửi thông báo cho User
        if (transaction.planType === "CANDIDATE_PRO") {
          await createNotification({
            userId: user._id,
            title: 'Nâng cấp tài khoản Pro thành công!',
            message: 'Chúc mừng bạn đã nâng cấp gói Pro 30 ngày. Bạn có 180 phút phỏng vấn AI và 50 lượt Review CV!',
            type: 'payment_success',
            link: '/upgrade'
          });
        } else if (transaction.planType === "BUSINESS_TOPUP") {
          await createNotification({
            userId: user._id,
            title: 'Nạp Token thành công!',
            message: `Bạn đã nạp thành công ${transaction.tokensAdded} Token vào tài khoản Doanh nghiệp.`,
            type: 'payment_success',
            link: '/bussiness/dashboard'
          });
        }
      }
      return res.json({ status: "PAID", message: "Kích hoạt gói thành công!" });
    }

    return res.json({ status: currentTx.status });
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

    // Kiểm tra hết hạn gói Candidate Pro & Chu kỳ reset 30 ngày
    if (user.role === "candidate") {
      let shouldSave = false;
      const now = new Date();

      if (user.subscription?.plan === "pro" && user.subscription.endDate && now > new Date(user.subscription.endDate)) {
        user.subscription.plan = "free";
        shouldSave = true;
      }

      // Chu kỳ reset hạn mức 30 ngày
      const lastReset = new Date(user.subscription?.usage?.lastResetDate || now);
      if (now - lastReset > 30 * 24 * 60 * 60 * 1000) {
        if (!user.subscription.usage) user.subscription.usage = {};
        user.subscription.usage.cvReviewCount = 0;
        user.subscription.usage.mockInterviewMinutes = 0;
        user.subscription.usage.roadmapCount = 0;
        user.subscription.usage.lastResetDate = now;
        shouldSave = true;
      }

      if (shouldSave) {
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
exports.getAllTransactions = async (req, res) => {
  try {
    // Chỉ Admin mới được xem
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const { page = 1, limit = 10, search, status } = req.query;
    const query = {};

    // Tìm theo orderCode (Mã đơn hàng là số)
    if (search && !isNaN(search)) {
      query.orderCode = Number(search);
    }

    // Lọc theo trạng thái (PAID, PENDING, CANCELLED)
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Truy vấn Transaction, móc nối (populate) để lấy Tên và Email của User
    const transactions = await Transaction.find(query)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    return res.json({
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    return res.status(500).json({ message: error.message });
  }
};