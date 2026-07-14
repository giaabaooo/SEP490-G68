// File: backend/routes/interview.routes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');

// Sửa lại dòng này: Import trực tiếp hàm thay vì dùng { auth }
const auth = require('../middleware/auth'); 

router.post('/usage', auth, interviewController.syncUsage);
router.post('/mock-interview', auth, interviewController.conductInterview);
router.post('/evaluate-interview', auth, interviewController.evaluateInterview);

module.exports = router;