const express = require('express');
const router = express.Router();
const { 
  getQuestions, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion 
} = require('../controllers/staff.question.controller');

// ❌ Tạm thời comment/xóa dòng này lại
// const { protect } = require('../middleware/auth.middleware'); 

// ❌ Bỏ chữ protect đi, gọi thẳng controller
router.route('/questions')
  .get(getQuestions)
  .post(createQuestion);

router.route('/questions/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;