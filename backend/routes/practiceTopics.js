const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const practiceTopicController = require('../controllers/practiceTopic.controller');

// Custom middleware to check if user is admin or moderator
const isModerator = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || (req.user.role === 'business' && req.user.subRole === 'moderator'))) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Only system staff/moderators allowed.' });
  }
};

router.get('/', auth, practiceTopicController.list);
router.get('/:id', auth, practiceTopicController.getById);
router.post('/', auth, isModerator, practiceTopicController.create);
router.put('/:id', auth, isModerator, practiceTopicController.update);
router.delete('/:id', auth, isModerator, practiceTopicController.delete);

module.exports = router;
