const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

router.get('/', auth, notificationController.list);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.put('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
