const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const Otp = require("../models/Otp");

const router = express.Router();

const sendEmail =
  require("../utils/sendEmail");

// Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);


// ===== ĐĂNG KÝ =====
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      companyName
    } = req.body;

    // Validate role
    if (!role || !["candidate", "business"].includes(role)) {
      return res.status(400).json({
        message: "Role phải là 'candidate' hoặc 'business'"
      });
    }

    const existed =
      await User.findOne({
        email
      });

    if (existed) {
      return res.status(400).json({
        message:
          "Email đã tồn tại"
      });
    }

    const hash =
      await bcrypt.hash(
        password,
        10
      );

    const otp = Math.floor(
      100000 +
      Math.random() *
      900000
    ).toString();

    await Otp.deleteMany({
      email
    });

    // LƯU TẠM THÔNG TIN
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

        <h1
        style="
        color:#2563eb;
        letter-spacing:5px
        "
        >
        ${otp}
        </h1>

        <p>
        Mã hết hạn sau 5 phút
        </p>
      </div>
      `
    );

    res.status(201).json({
      message:
        "Đã gửi OTP"
    });

  } catch (error) {
    res.status(500).json({
      message:
        error.message
    });
  }
});


// ===== VERIFY OTP =====
router.post(
  "/verify-otp",
  async (req, res) => {
    try {

      const {
        email,
        otp
      } = req.body;

      const otpRecord =
        await Otp.findOne({
          email,
          otp
        });

      if (!otpRecord) {
        return res
          .status(400)
          .json({
            message:
              "OTP không hợp lệ"
          });
      }

      const user =
        await User.create({
          ...otpRecord.data,
          isVerified: true,
          status: "active"
        });

      await Otp.deleteOne({
        _id:
          otpRecord._id
      });

      const token =
        jwt.sign(
          {
            id:
              user._id,
            role:
              user.role
          },
          process.env
            .JWT_SECRET,
          {
            expiresIn:
              "7d"
          }
        );

      res.json({
        message:
          "Đăng ký thành công",
        token,
        user
      });

    } catch (error) {
      res.status(500).json({
        message:
          error.message
      });
    }
  }
);


// ===== LOGIN =====
router.post(
  "/login",
  async (req, res) => {
    try {

      const {
        email,
        password
      } = req.body;

      const user =
        await User.findOne({
          email
        });

      if (!user) {
        return res
          .status(400)
          .json({
            message:
              "Email hoặc mật khẩu không đúng"
          });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res
          .status(400)
          .json({
            message:
              "Email hoặc mật khẩu không đúng"
          });
      }

      // Check status
      if (user.status === "banned") {
        return res
          .status(403)
          .json({
            message:
              "Tài khoản của bạn đã bị khóa"
          });
      }

      if (user.status === "pending") {
        return res
          .status(403)
          .json({
            message:
              "Tài khoản đang chờ xác nhận. Vui lòng liên hệ admin"
          });
      }

      const token =
        jwt.sign(
          {
            id:
              user._id,
            role:
              user.role
          },
          process.env
            .JWT_SECRET,
          {
            expiresIn:
              "7d"
          }
        );

      res.json({
        token,
        user
      });

    } catch (error) {
      res.status(500).json({
        message:
          error.message
      });
    }
  }
);


const auth =
  require(
    "../middleware/auth"
  );
const authorize =
  require(
    "../middleware/authorize"
  );

router.get(
  "/me",
  auth,
  async (
    req,
    res
  ) => {

    const user =
      await User.findById(
        req.user.id
      )
        .select(
          "-password"
        );

    res.json(
      user
    );
  }
);

// ===== PROTECTED ROUTES EXAMPLES =====

// Chỉ admin có thể access
router.get(
  "/admin-only",
  auth,
  authorize(['admin']),
  async (req, res) => {
    res.json({
      message: "Đây là trang admin"
    });
  }
);

// Chỉ business có thể access
router.get(
  "/business-only",
  auth,
  authorize(['business']),
  async (req, res) => {
    res.json({
      message: "Đây là trang business"
    });
  }
);

// Chỉ candidate có thể access
router.get(
  "/candidate-only",
  auth,
  authorize(['candidate']),
  async (req, res) => {
    res.json({
      message: "Đây là trang candidate"
    });
  }
);

// Admin và Business đều có thể access
router.get(
  "/employer-only",
  auth,
  authorize(['admin', 'business']),
  async (req, res) => {
    res.json({
      message: "Đây là trang employer"
    });
  }
);


// ===== GOOGLE LOGIN =====
router.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required"
      });
    }

    // Get user info from Google API using access token
    let response;
    try {
      response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (fetchError) {
      console.error("Fetch Google userinfo error:", fetchError);
      return res.status(400).json({
        message: "Failed to fetch Google user info"
      });
    }

    if (!response.ok) {
      console.error("Google API response not ok:", response.status);
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    const payload = await response.json();
    const { email, name, picture, id: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        message: "Email not found in Google token"
      });
    }

    // Kiểm tra user đã tồn tại chưa
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

      console.log("New Google user created");
    } else {
      // Update googleId nếu chưa có
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      // Check status
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

    // Tạo JWT Token
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
      isNewUser: isNewUser,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      message: error.message || "Google login failed",
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});


// ===== UPDATE USER ROLE =====
router.post("/update-role", auth, async (req, res) => {
  try {
    const { role, phone, companyName } = req.body;
    const userId = req.user.id;

    // Validate role theo đúng logic hệ thống
    if (!role || !["candidate", "business"].includes(role)) {
      return res.status(400).json({
        message: "Role phải là 'candidate' hoặc 'business'"
      });
    }

    // Build dữ liệu cập nhật
    const updateData = { role };
    
    if (phone) updateData.phone = phone;
    
    // Chỉ lưu tên doanh nghiệp nếu role là business
    if (role === "business" && companyName) {
      updateData.companyName = companyName;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Hoàn tất hồ sơ thành công",
      user
    });
  } catch (error) {
    console.error("Update onboarding error:", error);
    res.status(500).json({
      message: error.message || "Update failed"
    });
  }
});

module.exports =
  router;