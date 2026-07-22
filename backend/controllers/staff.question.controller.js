// backend/controllers/staff.question.controller.js
const PracticeQuestion = require('../models/PracticeQuestion');

// [GET] Lấy danh sách câu hỏi (Có hỗ trợ lọc theo topic)
exports.getQuestions = async (req, res) => {
  try {
    const { topic } = req.query;
    let query = {};
    if (topic) query.topic = topic;

    const questions = await PracticeQuestion.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu', error: error.message });
  }
};

// [POST] Thêm mới câu hỏi
exports.createQuestion = async (req, res) => {
  try {
    // Kiểm tra xem nếu có req.user thì lấy id, nếu không (đang test) thì bỏ qua hoặc gán 1 ID tạm
    // Lưu ý: ID tạm này phải đúng chuẩn chuẩn ObjectId của MongoDB (24 ký tự)
    const creatorId = req.user ? req.user.id : "64a1b2c3d4e5f6a7b8c9d0e1"; 

    const newQuestion = await PracticeQuestion.create({
      ...req.body,
      createdBy: creatorId 
    });
    res.status(201).json({ success: true, message: 'Tạo câu hỏi thành công', data: newQuestion });
  } catch (error) {
    console.log("LỖI TẠO CÂU HỎI:", error.message); // In lỗi ra terminal để dễ sửa
    res.status(400).json({ success: false, message: 'Không thể tạo câu hỏi', error: error.message });
  }
};

// [PUT] Chỉnh sửa câu hỏi
exports.updateQuestion = async (req, res) => {
  try {
    const question = await PracticeQuestion.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }
    res.status(200).json({ success: true, message: 'Cập nhật thành công', data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Lỗi khi cập nhật', error: error.message });
  }
};

// [DELETE] Xóa câu hỏi
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await PracticeQuestion.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa câu hỏi thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi xóa', error: error.message });
  }
};