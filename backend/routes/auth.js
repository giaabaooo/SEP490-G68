const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const authController = require("../controllers/auth.controller");

// Auth
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/login", authController.login);
router.post("/google-login", authController.googleLogin);

// User
router.get("/me", auth, authController.getMe);
router.post("/change-password", auth, authController.changePassword);
router.post("/update-role", auth, authController.updateRole);

// Protected Routes
router.get(
  "/admin-only",
  auth,
  authorize(["admin"]),
  authController.adminOnly
);

router.get(
  "/business-only",
  auth,
  authorize(["business"]),
  authController.businessOnly
);

router.get(
  "/candidate-only",
  auth,
  authorize(["candidate"]),
  authController.candidateOnly
);

router.get(
  "/employer-only",
  auth,
  authorize(["admin", "business"]),
  authController.employerOnly
);

module.exports = router;