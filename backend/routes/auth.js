const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Otp = require("../models/Otp");

const router = express.Router();

const sendEmail =
  require("../utils/sendEmail");


// ===== ĐĂNG KÝ =====
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      companyName,
      companySize,
      address
    } = req.body;

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
        companyName,
        companySize,
        address
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
          isVerified: true
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

module.exports =
  router;