// File: backend/routes/roadmap.route.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roadmapController = require('../controllers/roadmap.controller');

router.get('/:sourceId', auth, roadmapController.getRoadmap);
router.post('/generate', auth, roadmapController.generateRoadmap);

module.exports = router;