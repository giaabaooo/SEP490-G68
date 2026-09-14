const express = require("express");
const auth = require("../middleware/auth");
const multer = require("multer");

const router = express.Router();

const profileController = require("../controllers/profile.controller");

// Cấu hình Multer lưu tạm ảnh trong RAM trước khi đẩy lên Cloudinary
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .gif, .webp)"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// ===== UPLOAD AVATAR =====
router.post(
  "/avatar",
  auth,
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Lỗi upload file: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  profileController.uploadAvatar
);

module.exports = router;