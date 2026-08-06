const PracticeTopic = require('../models/PracticeTopic');
const PracticeResult = require('../models/PracticeResult');
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
    const { topicName, description, timeLimit, status, questions, level } = req.body;

    if (!topicName) {
      return res.status(400).json({ message: 'Topic name is required' });
    }

    const newTopic = await PracticeTopic.create({
      topicName,
      description,
      timeLimit: timeLimit || 30,
      level: level || 'free', // Nhận level (free/paid)
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
    const { topicName, description, timeLimit, status, questions, level } = req.body;

    const topic = await PracticeTopic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Practice topic not found' });
    }

    // Allow update
    topic.topicName = topicName || topic.topicName;
    topic.description = description !== undefined ? description : topic.description;
    topic.timeLimit = timeLimit !== undefined ? timeLimit : topic.timeLimit;
    topic.level = level || topic.level;
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
exports.getMyHistory = async (req, res) => {
    try {
        const history = await PracticeResult.find({ userId: req.user.id })
            .populate('practiceTopicId')
            .sort({ createdAt: -1 })
            .lean();

        // Format lại data cho giống hệt với cấu trúc Application Test của Job 
        // để Frontend dùng chung 1 component TestHistory & TestResult mượt mà.
        const formattedHistory = history.map(h => ({
            _id: h._id,
            testScore: h.score,
            testDuration: h.duration,
            testAnswers: h.answers,
            testSubmittedAt: h.createdAt,
            assessmentId: h.practiceTopicId, 
            jobId: { title: 'Bài tập: ' + (h.practiceTopicId?.topicName || '') },
            isPractice: true
        }));

        return res.json(formattedHistory);
    } catch (error) {
        console.error("Lỗi lấy lịch sử luyện tập:", error);
        return res.status(500).json({ message: 'Lỗi server khi lấy lịch sử' });
    }
};

// POST /api/practice-topics/:id/submit
exports.submitPractice = async (req, res) => {
    try {
        const { id } = req.params; 
        const { answers, duration } = req.body; 
        const userId = req.user.id;

        const topic = await PracticeTopic.findById(id);
        if (!topic) return res.status(404).json({ message: "Không tìm thấy chủ đề luyện tập" });

        let correctCount = 0;
        const totalQuestions = topic.questions.length;

        // Chấm điểm tự động
        topic.questions.forEach((q, index) => {
            const userAnswer = answers[index.toString()];
            if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / totalQuestions) * 100);

        // Lưu vào Database
        const newResult = await PracticeResult.create({
            userId,
            practiceTopicId: id,
            score,
            answers,
            duration
        });

        // Format dữ liệu trả về cho trang Result
        const formattedResult = {
            _id: newResult._id,
            testScore: score,
            testDuration: duration,
            testAnswers: answers,
            testSubmittedAt: newResult.createdAt,
            assessmentId: topic, 
            jobId: { title: 'Bài tập: ' + topic.topicName }, 
            isPractice: true
        };

        return res.json({ message: "Nộp bài thành công!", result: formattedResult });
    } catch (error) {
        console.error("Lỗi nộp bài luyện tập:", error);
        return res.status(500).json({ message: 'Lỗi server khi nộp bài' });
    }
};