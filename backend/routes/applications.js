const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const applicationController = require('../controllers/application.controller');

const uploadDir = path.join(__dirname, '../uploads/cvs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cv-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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

module.exports = router;
