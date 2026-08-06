const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');

// Import trực tiếp middleware auth
const auth = require('../middleware/auth'); 

router.post('/usage', auth, interviewController.syncUsage);
router.post('/mock-interview', auth, interviewController.conductInterview);
router.post('/evaluate-interview', auth, interviewController.evaluateInterview);

// Các API dạng GET
router.get('/templates', interviewController.getAvailableTemplates);

// SỬA Ở ĐÂY: Thay `verifyToken` thành `auth`
router.get('/history', auth, interviewController.getInterviewHistory); 

module.exports = router;