const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===== REGISTER =====
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, companyName } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập họ và tên" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập địa chỉ email" });
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có tối thiểu 6 ký tự" });
    }

    if (!role || !["candidate", "business"].includes(role)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ (chỉ chấp nhận 'candidate' hoặc 'business')" });
    }

    if (role === "business" && (!companyName || !companyName.trim())) {
      return res.status(400).json({ message: "Vui lòng nhập tên công ty/doanh nghiệp" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanFullName = fullName.trim();

    // Kiểm tra xem email đã tồn tại chưa (case-insensitive)
    const existed = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    if (existed) return res.status(400).json({ message: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác." });

    const hash = await bcrypt.hash(password.trim(), 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    await Otp.create({
      email: normalizedEmail,
      otp,
      data: {
        fullName: cleanFullName,
        email: normalizedEmail,
        password: hash,
        role,
        companyName: role === "business" ? companyName.trim() : "",
        status: "pending"
      }
    });

    console.log(`[AUTH REGISTER] Mã OTP tạo cho ${normalizedEmail} là: ${otp}`);

    try {
      await sendEmail(
        normalizedEmail,
        "Mã OTP xác thực Careerio",
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#059669;margin-top:0">Xác thực tài khoản Careerio</h2>
          <p style="color:#334155;font-size:14px">Chào <strong>${cleanFullName}</strong>,</p>
          <p style="color:#334155;font-size:14px">Cảm ơn bạn đã đăng ký tài khoản tại Careerio. Dưới đây là mã bảo mật OTP của bạn:</p>
          <div style="background:#f0fdf4;padding:16px;text-align:center;border-radius:8px;margin:20px 0">
            <span style="font-size:32px;font-weight:900;letter-spacing:6px;color:#059669">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:12px">Mã xác thực có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        </div>`
      );
    } catch (mailError) {
      console.error("Lỗi gửi email xác thực:", mailError);
      // Vẫn thông báo thành công trong môi trường dev, kèm OTP ghi nhận log
    }

    res.status(201).json({ message: "Đã gửi mã OTP về email của bạn" });
  } catch (error) {
    console.error("Lỗi register:", error);
    res.status(500).json({ message: error.message || "Đăng ký thất bại" });
  }
};

// ===== VERIFY OTP =====
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mã OTP" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }, 
      otp: cleanOtp 
    });

    if (!otpRecord) return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });

    // Kiểm tra trùng lặp email phòng trường hợp race condition
    const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    if (existingUser) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Tài khoản với email này đã được kích hoạt. Vui lòng đăng nhập." });
    }

    const role = otpRecord.data?.role || "candidate";

    const user = await User.create({
      ...otpRecord.data,
      email: normalizedEmail,
      role,
      subRole: role === "business" ? "hr" : "",
      isVerified: true,
      status: "active"
    });

    await Otp.deleteOne({ _id: otpRecord._id });

    // Cập nhật payload có thêm subRole
    const token = jwt.sign(
      { id: user._id, role: user.role, subRole: user.subRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Đăng ký tài khoản thành công", token, user });
  } catch (error) {
    console.error("Lỗi verifyOtp:", error);
    res.status(500).json({ message: error.message || "Xác thực OTP thất bại" });
  }
};

// ===== RESEND OTP =====
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email là bắt buộc" });

    const normalizedEmail = email.toLowerCase().trim();

    const oldRecord = await Otp.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    }).sort({ createdAt: -1 });

    if (!oldRecord || !oldRecord.data) {
      return res.status(400).json({ message: "Phiên đăng ký đã hết hạn. Vui lòng thực hiện đăng ký lại từ đầu." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    await Otp.create({
      email: normalizedEmail,
      otp,
      data: oldRecord.data
    });

    console.log(`[AUTH RESEND OTP] Mã OTP mới của ${normalizedEmail} là: ${otp}`);

    try {
      await sendEmail(
        normalizedEmail,
        "Mã OTP xác thực Careerio (Gửi lại)",
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#059669;margin-top:0">Mã OTP mới từ Careerio</h2>
          <p style="color:#334155;font-size:14px">Chào bạn, bạn vừa yêu cầu gửi lại mã xác thực:</p>
          <div style="background:#f0fdf4;padding:16px;text-align:center;border-radius:8px;margin:20px 0">
            <span style="font-size:32px;font-weight:900;letter-spacing:6px;color:#059669">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:12px">Mã xác thực có hiệu lực trong 5 phút.</p>
        </div>`
      );
    } catch (mailError) {
      console.error("Lỗi gửi lại email OTP:", mailError);
    }

    res.json({ message: "Đã gửi lại mã OTP về email của bạn" });
  } catch (error) {
    console.error("Lỗi resendOtp:", error);
    res.status(500).json({ message: error.message || "Lỗi gửi lại OTP" });
  }
};

// ===== FORGOT PASSWORD =====
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email là bắt buộc" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản với email này" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: normalizedEmail, "data.purpose": "reset-password" });
    await Otp.create({
      email: normalizedEmail,
      otp,
      data: { purpose: "reset-password" }
    });

    await sendEmail(
      normalizedEmail,
      "Mã OTP đặt lại mật khẩu Careerio",
      `<div style="font-family:Arial"><h2>Đặt lại mật khẩu Careerio</h2><p>Mã OTP của bạn:</p><h1 style="color:#2563eb;letter-spacing:5px">${otp}</h1><p>Mã hết hạn sau 5 phút</p></div>`
    );

    res.json({ message: "Đã gửi mã OTP để đặt lại mật khẩu" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== VERIFY RESET OTP =====
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email và OTP là bắt buộc" });

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp, "data.purpose": "reset-password" });
    if (!otpRecord) return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });

    await Otp.deleteOne({ _id: otpRecord._id });
    res.json({ message: "OTP hợp lệ", email: normalizedEmail });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== RESET PASSWORD =====
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email và mật khẩu mới là bắt buộc" });
    if (password.length < 6) return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Không tìm thấy tài khoản" });

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    await user.save();

    // Cập nhật payload có thêm subRole
    const token = jwt.sign(
      { id: user._id, role: user.role, subRole: user.subRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đặt lại mật khẩu thành công",
      token,
      user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== LOGIN =====
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Vui lòng nhập đầy đủ email và mật khẩu" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });

    if (!user) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    if (!user.password) {
      return res.status(400).json({
        message: "Tài khoản này được đăng ký qua Google. Vui lòng bấm 'Đăng nhập với Google' hoặc sử dụng 'Quên mật khẩu' để đặt mật khẩu."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    if (user.status === "banned") return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
    if (user.status === "pending") return res.status(403).json({ message: "Tài khoản đang chờ xác nhận. Vui lòng liên hệ admin" });

    // Chỉ tự động nâng cấp moderator cho tài khoản CHƯA là HR và CHƯA có doanh nghiệp (không bao giờ ghi đè HR)
    const Job = require('../models/Job');
    if (user.role !== 'admin' && user.subRole !== 'moderator' && user.subRole !== 'hr' && !user.companyName) {
      const isAssignedMod = await Job.exists({ 
        moderatorEmail: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }, 
        requireTest: true 
      });
      if (isAssignedMod) {
        user.role = "business";
        user.subRole = "moderator";
        await user.save();
      }
    }

    // Cập nhật payload có thêm subRole
    const token = jwt.sign(
      { id: user._id, role: user.role, subRole: user.subRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== GET ME =====
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

// ===== CHANGE PASSWORD =====
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    if (!user.password) return res.status(400).json({ message: "Tài khoản này chưa có mật khẩu để đổi" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== GOOGLE LOGIN =====
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // Gọi trực tiếp API Google
    let response;
    try {
      response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      return res.status(400).json({ message: "Failed to fetch Google user info" });
    }

    if (!response.ok) return res.status(400).json({ message: "Invalid or expired token" });

    const payload = await response.json();
    const email = payload.email;
    const name = payload.name;
    const googleId = payload.id;

    if (!email) return res.status(400).json({ message: "Email not found in Google token" });

    // ==== PHẦN LOGIC CHECK DB GIỮ NGUYÊN ====
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      if (user.status === "banned") return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
      if (user.status === "pending") {
        user.status = "active";
        user.isVerified = true;
        await user.save();
      }

      // Chỉ tự động nâng cấp moderator cho tài khoản CHƯA là HR và CHƯA có doanh nghiệp (không bao giờ ghi đè HR)
      const Job = require('../models/Job');
      if (user.role !== 'admin' && user.subRole !== 'moderator' && user.subRole !== 'hr' && !user.companyName) {
        const isAssignedMod = await Job.exists({ 
          moderatorEmail: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }, 
          requireTest: true 
        });
        if (isAssignedMod) {
          user.role = "business";
          user.subRole = "moderator";
          await user.save();
        }
      }

      const jwtToken = jwt.sign(
        { id: user._id, role: user.role, subRole: user.subRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Google login thành công",
        token: jwtToken,
        isNewUser: false,
        user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role, subRole: user.subRole, status: user.status }
      });
    }

    // TÀI KHOẢN MỚI
    // Kiểm tra xem email này có được HR chỉ định làm Moderator trong Job không
    const Job = require('../models/Job');
    const isAssignedMod = await Job.exists({ 
      moderatorEmail: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }, 
      requireTest: true 
    });

    if (isAssignedMod) {
      user = await User.create({
        email: normalizedEmail,
        fullName: name || "Chuyên gia Kiểm duyệt (Moderator)",
        googleId,
        role: "business",
        subRole: "moderator",
        status: "active",
        isVerified: true
      });

      const jwtToken = jwt.sign(
        { id: user._id, role: user.role, subRole: user.subRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Google login thành công với vai trò Moderator",
        token: jwtToken,
        isNewUser: false,
        user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role, subRole: user.subRole, status: user.status }
      });
    }

    // TÀI KHOẢN MỚI THÔNG THƯỜNG -> Yêu cầu Onboarding
    const tempPayload = { email, name, googleId, purpose: "google-onboarding" };
    const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      message: "Tài khoản mới, cần hoàn tất Onboarding",
      isNewUser: true,
      tempToken, 
      email 
    });

  } catch (error) {
    res.status(500).json({ message: error.message || "Google login failed" });
  }
};

// ===== UPDATE ROLE =====
exports.updateRole = async (req, res) => {
  try {
    const { role, phone, companyName } = req.body;
    const updateData = { role };
    if (phone) updateData.phone = phone;
    if (role === "business" && companyName) updateData.companyName = companyName;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Hoàn tất hồ sơ thành công", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.sendGoogleOnboardingOtp = async (req, res) => {
    try {
        // middleware sẽ check JWT (tempToken) và ném vào req.user (hoặc req.tempData)
        // Nhưng tạm thời ta nhận từ body cho đơn giản (vì tempToken FE gửi lên)
        const { tempToken, role, phone, companyName, taxCode, address, city } = req.body;
        
        if(!tempToken) return res.status(400).json({ message: "Missing tempToken" });
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if(decoded.purpose !== 'google-onboarding') return res.status(400).json({ message: "Invalid token purpose" });

        const email = decoded.email;
        const fullName = decoded.name;
        const googleId = decoded.googleId;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.deleteMany({ email });
        // Lưu tạm data vào bảng Otp
        await Otp.create({
            email,
            otp,
            data: {
                fullName,
                email,
                googleId,
                role,
                phone: phone || "",
                companyName: role === "business" ? (companyName || "") : "",
                taxCode: role === "business" ? (taxCode || "") : "",
                address: role === "business" ? (address || "") : "",
                city: role === "business" ? (city || "") : "",
                status: "active",
                isVerified: true // Vì GG đã verify email
            }
        });

        await sendEmail(
            email,
            "Xác thực hoàn tất hồ sơ Careerio",
            `<div style="font-family:Arial"><h2>Hoàn tất hồ sơ Careerio</h2><p>Mã OTP của bạn:</p><h1 style="color:#2563eb;letter-spacing:5px">${otp}</h1></div>`
        );

        res.json({ message: "Đã gửi OTP" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.completeGoogleOnboarding = async (req, res) => {
  try {
    const { tempToken, role, phone, companyName, taxCode, address, city, email, otp } = req.body;

    // CASE 1: Hoàn tất trực tiếp bằng tempToken (Google OAuth đã xác thực email, KHÔNG CẦN OTP)
    if (tempToken) {
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Phiên đăng ký đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại." });
      }

      if (decoded.purpose !== 'google-onboarding') {
        return res.status(400).json({ message: "Mục đích xác thực không hợp lệ." });
      }

      const normalizedEmail = decoded.email.toLowerCase().trim();
      const fullName = decoded.name || "Người dùng";
      const googleId = decoded.googleId;

      const userRole = role === "business" ? "business" : "candidate";

      // Kiểm tra User đã tồn tại trong DB chưa (phòng trường hợp đã được tạo trước)
      let user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });

      if (user) {
        if (!user.googleId) user.googleId = googleId;
        user.isVerified = true;
        user.status = "active";
        if (phone?.trim()) user.phone = phone.trim();
        if (city?.trim()) user.city = city.trim();
        if (userRole === "business") {
          user.role = "business";
          user.subRole = user.subRole || "hr";
          if (companyName?.trim()) user.companyName = companyName.trim();
          if (taxCode?.trim()) user.taxCode = taxCode.trim();
          if (address?.trim()) user.address = address.trim();
        }
        await user.save();
      } else {
        // Validate dữ liệu bắt buộc
        if (userRole === "business") {
          if (!companyName?.trim()) return res.status(400).json({ message: "Vui lòng nhập tên công ty/doanh nghiệp" });
          if (!taxCode?.trim()) return res.status(400).json({ message: "Vui lòng nhập mã số thuế" });
          if (!address?.trim()) return res.status(400).json({ message: "Vui lòng nhập địa chỉ công ty" });

          user = await User.create({
            fullName,
            email: normalizedEmail,
            googleId,
            role: "business",
            subRole: "hr",
            companyName: companyName.trim(),
            taxCode: taxCode.trim(),
            address: address.trim(),
            city: city?.trim() || "Hà Nội",
            phone: phone?.trim() || "",
            status: "active",
            isVerified: true,
            businessCredits: { balance: 100 }
          });
        } else {
          // Candidate
          user = await User.create({
            fullName,
            email: normalizedEmail,
            googleId,
            role: "candidate",
            subRole: "",
            phone: phone?.trim() || "",
            city: city?.trim() || "Hà Nội",
            status: "active",
            isVerified: true,
            subscription: { plan: "free" }
          });
        }
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, subRole: user.subRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Hoàn tất thiết lập hồ sơ thành công",
        token,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          subRole: user.subRole,
          status: user.status
        }
      });
    }

    // CASE 2: Hỗ trợ luồng cũ có OTP (backward compatibility)
    if (email && otp) {
      const normalizedEmail = email.toLowerCase().trim();
      const cleanOtp = otp.toString().trim();
      const otpRecord = await Otp.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
        otp: cleanOtp
      });

      if (!otpRecord) return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });

      const userRole = otpRecord.data?.role || "candidate";

      const user = await User.create({
        ...otpRecord.data,
        role: userRole,
        subRole: userRole === "business" ? "hr" : "",
        status: "active",
        isVerified: true
      });

      await Otp.deleteOne({ _id: otpRecord._id });

      const token = jwt.sign(
        { id: user._id, role: user.role, subRole: user.subRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Đăng nhập và hoàn tất hồ sơ thành công",
        token,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          subRole: user.subRole,
          status: user.status
        }
      });
    }

    return res.status(400).json({ message: "Vui lòng cung cấp mã phiên đăng ký (tempToken)" });
  } catch (error) {
    console.error("Lỗi completeGoogleOnboarding:", error);
    res.status(500).json({ message: error.message || "Hoàn tất hồ sơ thất bại" });
  }
};
exports.acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
        return res.status(400).json({ message: "Thiếu thông tin Token hoặc Mật khẩu." });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    // 1. Giải mã Token từ URL
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, role, subRole } = decoded;

    // 2. Kiểm tra xem lời mời có hợp lệ trong DB không (Chống link giả mạo)
    const otpRecord = await Otp.findOne({ email, "data.purpose": "moderator-invite" });
    if (!otpRecord) {
        return res.status(400).json({ message: "Lời mời này không tồn tại, đã được sử dụng, hoặc đã hết hạn." });
    }

    // 3. Kiểm tra User đã tồn tại chưa
    const hash = await bcrypt.hash(password, 10);
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });

    if (user) {
      user.password = hash;
      if (user.role !== 'admin') {
        user.role = "business";
        user.subRole = "moderator";
      }
      user.status = "active";
      user.isVerified = true;
      await user.save();
    } else {
      // 4. Tạo tài khoản Moderator mới
      user = await User.create({
        email: normalizedEmail,
        password: hash,
        fullName: "Chuyên gia Kiểm duyệt (Moderator)",
        role: role || "business",
        subRole: subRole || "moderator",
        status: "active",
        isVerified: true
      });
    }

    // 5. Xóa record mời để link không dùng lại được nữa
    await Otp.deleteOne({ _id: otpRecord._id });

    // 6. Tạo JWT Đăng nhập luôn cho user
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role, subRole: user.subRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Thiết lập mật khẩu thành công!",
      token: jwtToken,
      user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role, subRole: user.subRole, status: user.status }
    });

  } catch (error) {
    console.error("Accept invite error:", error);
    if (error.name === "TokenExpiredError") {
        return res.status(400).json({ message: "Đường link mời đã hết hạn (quá 7 ngày)." });
    }
    res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
  }
};

// ===== ADMIN/BUSINESS/CANDIDATE/EMPLOYER ONLY (Placeholder) =====
exports.adminOnly = async (req, res) => res.json({ message: "Đây là trang admin" });
exports.businessOnly = async (req, res) => res.json({ message: "Đây là trang business" });
exports.candidateOnly = async (req, res) => res.json({ message: "Đây là trang candidate" });
exports.employerOnly = async (req, res) => res.json({ message: "Đây là trang employer" });