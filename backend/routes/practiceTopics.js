const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Giữ nguyên import auth của bạn
const practiceTopicController = require('../controllers/practiceTopic.controller');

// Tự định nghĩa middleware kiểm tra quyền Admin trực tiếp tại đây
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Only admin allowed.' });
  }
};

// ==========================================
// --- API CHO CANDIDATE ---
// ==========================================
router.get('/', practiceTopicController.list);
router.get('/my-history', auth, practiceTopicController.getMyHistory); // Phải nằm trên /:id
router.get('/:id', auth, practiceTopicController.getById);
router.post('/:id/submit', auth, practiceTopicController.submitPractice); 

// ==========================================
// --- API CHO ADMIN ---
// ==========================================
router.post('/', auth, isAdmin, practiceTopicController.create);
router.put('/:id', auth, isAdmin, practiceTopicController.update);
router.delete('/:id', auth, isAdmin, practiceTopicController.delete);

module.exports = router;