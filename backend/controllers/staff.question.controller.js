const PracticeQuestion = require('../models/PracticeQuestion');

// [GET] Lấy danh sách (Gộp theo chủ đề và đếm số câu hỏi)
exports.getQuestions = async (req, res) => {
  try {
    const topics = await PracticeQuestion.aggregate([
      {
        $group: {
          _id: "$topic",
          questionCount: { $sum: 1 },
          createdAt: { $max: "$createdAt" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    const data = topics.map(t => ({
      topic: t._id,
      questionCount: t.questionCount,
      createdAt: t.createdAt
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// [GET] Lấy toàn bộ câu hỏi của 1 chủ đề (Dùng cho màn Edit)
exports.getQuestionsByTopic = async (req, res) => {
  try {
    const questions = await PracticeQuestion.find({ topic: req.params.topic }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// [POST] Thêm mới chủ đề (Chặn trùng lặp)
exports.createQuestion = async (req, res) => {
  try {
    const creatorId = req.user ? req.user.id : "64a1b2c3d4e5f6a7b8c9d0e1"; 
    const { topic, questions } = req.body;

    // 1. Kiểm tra trùng chủ đề
    const existingTopic = await PracticeQuestion.findOne({ topic });
    if (existingTopic) {
      return res.status(400).json({ 
        success: false, 
        message: `Chủ đề "${topic}" đã tồn tại! Vui lòng vào màn hình chỉnh sửa để thêm câu hỏi.` 
      });
    }

    // 2. Thêm mới
    if (questions && Array.isArray(questions)) {
      const dataToInsert = questions.map(q => ({
        topic,
        questionText: q.questionText,
        options: q.options,
        explanation: q.explanation,
        createdBy: creatorId
      }));
      const insertedData = await PracticeQuestion.insertMany(dataToInsert);
      return res.status(201).json({ success: true, message: `Đã tạo ${insertedData.length} câu hỏi`, data: insertedData });
    }
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Không thể tạo', error: error.message });
  }
};

// [PUT] Cập nhật TOÀN BỘ chủ đề (Sửa câu cũ, Thêm câu mới, Xóa câu thừa)
exports.updateTopic = async (req, res) => {
  try {
    const oldTopic = req.params.topic;
    const { topic: newTopic, questions } = req.body;
    const creatorId = req.user ? req.user.id : "64a1b2c3d4e5f6a7b8c9d0e1";

    const currentQuestions = await PracticeQuestion.find({ topic: oldTopic });
    const currentIds = currentQuestions.map(q => q._id.toString());
    const incomingIds = questions.filter(q => q._id).map(q => q._id);

    // Xóa những câu hỏi bị loại bỏ khỏi form
    const idsToDelete = currentIds.filter(id => !incomingIds.includes(id));
    if (idsToDelete.length > 0) {
      await PracticeQuestion.deleteMany({ _id: { $in: idsToDelete } });
    }

    // Xử lý Cập nhật câu cũ & Thêm câu mới
    for (let q of questions) {
      if (q._id) {
        await PracticeQuestion.findByIdAndUpdate(q._id, {
          topic: newTopic,
          questionText: q.questionText,
          options: q.options,
          explanation: q.explanation
        });
      } else {
        await PracticeQuestion.create({
          topic: newTopic,
          questionText: q.questionText,
          options: q.options,
          explanation: q.explanation,
          createdBy: creatorId
        });
      }
    }

    res.status(200).json({ success: true, message: 'Cập nhật chủ đề thành công!' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi khi cập nhật', error: error.message });
  }
};

// [DELETE] Xóa toàn bộ chủ đề
exports.deleteTopic = async (req, res) => {
  try {
    await PracticeQuestion.deleteMany({ topic: req.params.topic });
    res.status(200).json({ success: true, message: 'Đã xóa toàn bộ chủ đề' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};