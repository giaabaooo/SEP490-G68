const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const applicationController = require('../controllers/application.controller');

// Cấu hình Multer lưu tạm file trong RAM trước khi đẩy lên Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' || ext === '.pdf' || ext === '.doc' || ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file định dạng PDF hoặc Word (.doc, .docx)'), false);
    }
  }
});

// Candidate apply for job
router.post('/', auth, authorize(['candidate']), (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Lỗi upload CV' });
    }
    next();
  });
}, applicationController.createApplication);
router.post('/preview-match', auth, authorize(['candidate']), (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, applicationController.previewCVMatch);
router.get('/review-history/:jobId', auth, authorize(['candidate']), applicationController.getReviewHistory);
router.get('/my-test-history', auth, authorize(['candidate']), applicationController.getMyTestHistory);
// List applications (recruiter + admin + candidate)
router.get('/', auth, authorize(['business', 'admin', 'candidate']), applicationController.list);

// Get statistics (recruiter + admin)
router.get('/stats/summary', auth, authorize(['business', 'admin']), applicationController.getStatsSummary);

// Get single application details
router.get('/:id', auth, authorize(['business', 'admin']), applicationController.getById);

// Update application status
router.put('/:id/status', auth, authorize(['business', 'admin']), applicationController.updateStatus);

// Send notification to candidate
router.post('/:id/notify', auth, authorize(['business', 'admin']), applicationController.sendNotification);

// Re-evaluate application CV by AI according to Job bands
router.post('/:id/re-evaluate', auth, authorize(['business', 'admin']), applicationController.reEvaluate);

module.exports = router;
