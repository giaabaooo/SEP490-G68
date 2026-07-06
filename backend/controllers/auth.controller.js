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
    const {
      fullName,
      email,
      password,
      role,
      companyName
    } = req.body;

    if (!role || !["candidate", "business"].includes(role)) {
      return res.status(400).json({
        message: "Role phải là 'candidate' hoặc 'business'"
      });
    }

    const existed = await User.findOne({ email });

    if (existed) {
      return res.status(400).json({
        message: "Email đã tồn tại"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

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
      `
      <div style="font-family:Arial">
        <h2>Xác thực tài khoản Careerio</h2>
        <p>Mã OTP của bạn:</p>
        <h1 style="color:#2563eb;letter-spacing:5px">${otp}</h1>
        <p>Mã hết hạn sau 5 phút</p>
      </div>
      `
    );

    res.status(201).json({
      message: "Đã gửi OTP"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== VERIFY OTP =====
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      otp
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP không hợp lệ"
      });
    }

    const user = await User.create({
      ...otpRecord.data,
      isVerified: true,
      status: "active"
    });

    await Otp.deleteOne({
      _id: otpRecord._id
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Đăng ký thành công",
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== FORGOT PASSWORD =====
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email là bắt buộc"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "Không tìm thấy tài khoản với email này"
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await Otp.deleteMany({
      email: normalizedEmail,
      "data.purpose": "reset-password"
    });

    await Otp.create({
      email: normalizedEmail,
      otp,
      data: {
        purpose: "reset-password"
      }
    });

    await sendEmail(
      normalizedEmail,
      "Mã OTP đặt lại mật khẩu Careerio",
      `
      <div style="font-family:Arial">
        <h2>Đặt lại mật khẩu Careerio</h2>
        <p>Mã OTP của bạn:</p>
        <h1 style="color:#2563eb;letter-spacing:5px">${otp}</h1>
        <p>Mã hết hạn sau 5 phút</p>
      </div>
      `
    );

    res.json({
      message: "Đã gửi mã OTP để đặt lại mật khẩu"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== VERIFY RESET OTP =====
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email và OTP là bắt buộc"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp,
      "data.purpose": "reset-password"
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP không hợp lệ hoặc đã hết hạn"
      });
    }

    await Otp.deleteOne({
      _id: otpRecord._id
    });

    res.json({
      message: "OTP hợp lệ",
      email: normalizedEmail
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== RESET PASSWORD =====
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email và mật khẩu mới là bắt buộc"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "Không tìm thấy tài khoản"
      });
    }

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Đặt lại mật khẩu thành công",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== LOGIN =====
exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    if (user.status === "banned") {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa"
      });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        message: "Tài khoản đang chờ xác nhận. Vui lòng liên hệ admin"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      user
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== GET ME =====
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password");

  res.json(user);
};

// ===== CHANGE PASSWORD =====
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng"
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "Tài khoản này chưa có mật khẩu để đổi"
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng"
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.json({
      message: "Đổi mật khẩu thành công"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ===== ADMIN =====
exports.adminOnly = async (req, res) => {
  res.json({
    message: "Đây là trang admin"
  });
};

// ===== BUSINESS =====
exports.businessOnly = async (req, res) => {
  res.json({
    message: "Đây là trang business"
  });
};

// ===== CANDIDATE =====
exports.candidateOnly = async (req, res) => {
  res.json({
    message: "Đây là trang candidate"
  });
};

// ===== EMPLOYER =====
exports.employerOnly = async (req, res) => {
  res.json({
    message: "Đây là trang employer"
  });
};

// ===== GOOGLE LOGIN =====
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required"
      });
    }

    let response;

    try {
      response = await fetch(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (err) {
      return res.status(400).json({
        message: "Failed to fetch Google user info"
      });
    }

    if (!response.ok) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    const payload = await response.json();

    const {
      email,
      name,
      id: googleId
    } = payload;

    if (!email) {
      return res.status(400).json({
        message: "Email not found in Google token"
      });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        email,
        fullName: name || "Google User",
        role: "candidate",
        status: "active",
        isVerified: true,
        googleId
      });

      isNewUser = true;
    } else {

      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      if (user.status === "banned") {
        return res.status(403).json({
          message: "Tài khoản của bạn đã bị khóa"
        });
      }

      if (user.status === "pending") {
        return res.status(403).json({
          message: "Tài khoản đang chờ xác nhận. Vui lòng liên hệ admin"
        });
      }
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Google login thành công",
      token: jwtToken,
      isNewUser,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Google login failed"
    });
  }
};

// ===== UPDATE ROLE =====
exports.updateRole = async (req, res) => {
  try {

    const {
      role,
      phone,
      companyName
    } = req.body;

    const updateData = {
      role
    };

    if (phone) updateData.phone = phone;

    if (role === "business" && companyName) {
      updateData.companyName = companyName;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: updateData
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    res.json({
      message: "Hoàn tất hồ sơ thành công",
      user
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};