const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const applicationController = require('../controllers/application.controller');

// List applications (recruiter + admin)
router.get('/', auth, authorize(['business', 'admin']), applicationController.list);

// Get single application details
router.get('/:id', auth, authorize(['business', 'admin']), applicationController.getById);

module.exports = router;
