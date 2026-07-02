const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

const profileController = require("../controllers/profile.controller");

// ===== GET PROFILE =====
router.get(
  "/",
  auth,
  profileController.getProfile
);

// ===== UPDATE PROFILE =====
router.put(
  "/",
  auth,
  profileController.updateProfile
);

module.exports = router;