const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authOptional = require("../middleware/authOptional");
const jobController = require("../controllers/job.controller");

// 1. Lấy danh sách công việc (Có tìm kiếm, lọc)
router.get("/", jobController.getJobs);

// 2. Lấy chi tiết một công việc cụ thể theo ID
//  Route này gọi hàm getJobById để phục vụ trang JobDetail ở Frontend
router.get("/:id", jobController.getJobById);

// 3. Tạo tin tuyển dụng mới
router.post("/", auth, jobController.createJob);

// 4. Cập nhật/Chỉnh sửa tin tuyển dụng
//  Route này gọi hàm updateJob để phục vụ trang EditJob của HR
router.put("/:id", auth, jobController.updateJob);

module.exports = router;