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

    if (!role || !["candidate", "business"].includes(role)) {
      return res.status(400).json({ message: "Role phải là 'candidate' hoặc 'business'" });
    }

    const existed = await User.findOne({ email });
    if (existed) return res.status(400).json({ message: "Email đã tồn tại" });

    const hash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      data: {
        fullName,
        email,
        password: hash,
        role,
        companyName: role === "business" ? (companyName || "") : "",
        status: "pending"
      }
    });

    await sendEmail(
      email,
      "Mã OTP xác thực Careerio",
      `<div style="font-family:Arial"><h2>Xác thực tài khoản Careerio</h2><p>Mã OTP của bạn:</p><h1 style="color:#2563eb;letter-spacing:5px">${otp}</h1><p>Mã hết hạn sau 5 phút</p></div>`
    );

    res.status(201).json({ message: "Đã gửi OTP" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== VERIFY OTP =====
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) return res.status(400).json({ message: "OTP không hợp lệ" });

    const user = await User.create({
      ...otpRecord.data,
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

    res.json({ message: "Đăng ký thành công", token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });

    if (user.status === "banned") return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
    if (user.status === "pending") return res.status(403).json({ message: "Tài khoản đang chờ xác nhận. Vui lòng liên hệ admin" });

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
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      if (user.status === "banned") return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa" });
      if (user.status === "pending") return res.status(403).json({ message: "Tài khoản đang chờ xác nhận." });

      const jwtToken = jwt.sign(
        { id: user._id, role: user.role, subRole: user.subRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Google login thành công",
        token: jwtToken,
        isNewUser: false,
        user: { _id: user._id, email: user.email, fullName: user.fullName, role: user.role, status: user.status }
      });
    }

    // TÀI KHOẢN MỚI -> Yêu cầu Onboarding
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
        const { email, otp } = req.body;
        const otpRecord = await Otp.findOne({ email, otp });

        if (!otpRecord) return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });

        // Tạo user THẬT trong db
        const user = await User.create({
            ...otpRecord.data
        });

        await Otp.deleteOne({ _id: otpRecord._id });

        const token = jwt.sign(
            { id: user._id, role: user.role, subRole: user.subRole },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ message: "Đăng nhập và hoàn tất hồ sơ thành công", token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
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

    // 3. Kiểm tra User đã tồn tại chưa (Đề phòng click link 2 lần)
    let user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({ message: "Tài khoản của bạn đã được tạo. Vui lòng quay lại trang Đăng nhập." });
    }

    // 4. Tạo tài khoản Moderator
    const hash = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      password: hash,
      fullName: "Chuyên gia Kiểm duyệt (SME)", // Tên mặc định, họ có thể sửa sau
      role: role || "business",
      subRole: subRole || "moderator",
      status: "active",
      isVerified: true
    });

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