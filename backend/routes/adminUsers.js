const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const adminUserController = require("../controllers/adminUser.controller");

// Tất cả API trong file này chỉ dành cho admin
router.use(auth);
router.use(authorize(["admin"]));

// UC49 - Quản lý người dùng
router.get("/", adminUserController.getUsers);
router.get("/:id", adminUserController.getUserById);
router.put("/:id", adminUserController.updateUser);

// UC50 - Khóa/Mở khóa tài khoản
router.patch("/:id/status", adminUserController.updateUserStatus);

// UC51 - Phân quyền người dùng
router.patch("/:id/role", adminUserController.updateUserRole);

module.exports = router;