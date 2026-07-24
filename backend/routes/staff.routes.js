const express = require('express');
const router = express.Router();
const { 
  getQuestions, 
  getQuestionsByTopic,
  createQuestion, 
  updateTopic, 
  deleteTopic 
} = require('../controllers/staff.question.controller');

// Lấy danh sách các chủ đề (kèm số lượng câu hỏi) & Tạo chủ đề mới
router.route('/questions')
  .get(getQuestions)
  .post(createQuestion);

// Thao tác với MỘT chủ đề cụ thể (Lấy chi tiết, Cập nhật toàn bộ, Xóa toàn bộ)
router.route('/questions/:topic')
  .get(getQuestionsByTopic)
  .put(updateTopic)
  .delete(deleteTopic);

module.exports = router;