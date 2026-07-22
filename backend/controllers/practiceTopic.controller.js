const PracticeTopic = require('../models/PracticeTopic');

// GET /api/practice-topics
exports.list = async (req, res) => {
  try {
    const topics = await PracticeTopic.find({})
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    return res.json(topics);
  } catch (error) {
    console.error('List practice topics error:', error);
    return res.status(500).json({ message: 'Error retrieving practice topics' });
  }
};

// GET /api/practice-topics/:id
exports.getById = async (req, res) => {
  try {
    const topic = await PracticeTopic.findById(req.params.id)
      .populate('createdBy', 'fullName email');
    if (!topic) {
      return res.status(404).json({ message: 'Practice topic not found' });
    }
    return res.json(topic);
  } catch (error) {
    console.error('Get practice topic error:', error);
    return res.status(500).json({ message: 'Error retrieving practice topic details' });
  }
};

// POST /api/practice-topics
exports.create = async (req, res) => {
  try {
    const { topicName, description, timeLimit, status, questions } = req.body;

    if (!topicName) {
      return res.status(400).json({ message: 'Topic name is required' });
    }

    const newTopic = await PracticeTopic.create({
      topicName,
      description,
      timeLimit: timeLimit || 30,
      status: status || 'PUBLISHED',
      createdBy: req.user.id,
      questions: questions || []
    });

    return res.status(201).json({
      message: 'Practice topic created successfully',
      data: newTopic
    });
  } catch (error) {
    console.error('Create practice topic error:', error);
    return res.status(500).json({ message: 'Error creating practice topic' });
  }
};

// PUT /api/practice-topics/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { topicName, description, timeLimit, status, questions } = req.body;

    const topic = await PracticeTopic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Practice topic not found' });
    }

    // Allow update
    topic.topicName = topicName || topic.topicName;
    topic.description = description !== undefined ? description : topic.description;
    topic.timeLimit = timeLimit !== undefined ? timeLimit : topic.timeLimit;
    topic.status = status || topic.status;
    topic.questions = questions || topic.questions;

    await topic.save();

    return res.json({
      message: 'Practice topic updated successfully',
      data: topic
    });
  } catch (error) {
    console.error('Update practice topic error:', error);
    return res.status(500).json({ message: 'Error updating practice topic' });
  }
};

// DELETE /api/practice-topics/:id
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await PracticeTopic.findByIdAndDelete(id);
    if (!topic) {
      return res.status(404).json({ message: 'Practice topic not found' });
    }

    return res.json({ message: 'Practice topic deleted successfully' });
  } catch (error) {
    console.error('Delete practice topic error:', error);
    return res.status(500).json({ message: 'Error deleting practice topic' });
  }
};
