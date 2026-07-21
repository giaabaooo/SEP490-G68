const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const jobController = require("../controllers/job.controller");

// 1. Lấy danh sách công việc (Có tìm kiếm, lọc)
// FIX: Bổ sung authOptional để Backend phân biệt được Guest và Business
router.get("/", authOptional, jobController.getJobs);

// 2. API dành riêng cho Moderator lấy danh sách Yêu cầu test
// LƯU Ý: Route này phải đặt TRƯỚC route /:id để tránh bị nhầm lẫn params
router.get("/moderator-requests", auth, jobController.getModeratorRequests);

// 3. Lấy chi tiết một công việc cụ thể theo ID
// FIX: Bổ sung authOptional để Business có quyền xem Job Draft của chính mình
router.get("/:id", authOptional, jobController.getJobById);

// 4. Tạo tin tuyển dụng mới
router.post("/", auth, jobController.createJob);

// 5. Cập nhật/Chỉnh sửa tin tuyển dụng
router.put("/:id", auth, jobController.updateJob);

module.exports = router;