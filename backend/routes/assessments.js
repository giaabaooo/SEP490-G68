// File: backend/routes/assessments.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const assessmentController = require("../controllers/assessment.controller");

router.post("/generate-ai", auth, assessmentController.generateAI);
router.post("/create", auth, assessmentController.createAssessment);

// 3 API MỚI CHO TÍNH NĂNG NGÂN HÀNG TEST VÀ EDIT TEST
router.get("/my-tests", auth, assessmentController.getMyTests);
router.get("/:id", auth, assessmentController.getTestById);
router.put("/:id", auth, assessmentController.updateAssessment);

module.exports = router;