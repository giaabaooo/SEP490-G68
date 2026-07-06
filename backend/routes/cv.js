// routes/cv.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { saveCV, getMyCVs } = require('../controllers/cvController');

router.post('/save', auth, saveCV);
router.get('/my-cvs', auth, getMyCVs);

module.exports = router;