const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const applicationController = require('../controllers/application.controller');

// List applications (recruiter + admin)
router.get('/', auth, authorize(['business', 'admin']), applicationController.list);

// Get statistics (recruiter + admin)
router.get('/stats/summary', auth, authorize(['business', 'admin']), applicationController.getStatsSummary);

// Get single application details
router.get('/:id', auth, authorize(['business', 'admin']), applicationController.getById);

// Update application status
router.put('/:id/status', auth, authorize(['business', 'admin']), applicationController.updateStatus);

// Send notification to candidate
router.post('/:id/notify', auth, authorize(['business', 'admin']), applicationController.sendNotification);

module.exports = router;
