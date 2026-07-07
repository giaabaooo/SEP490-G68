// controllers/cvController.js
const CV = require('../models/CV');

// [POST] Tạo mới hoặc Lưu CV
exports.saveCV = async (req, res) => {
  try {
    const { cvId, title, design, data } = req.body;
    const userId = req.user.id;

    // Validate backend cơ bản
    if (!data.personal.fullName || !data.personal.email) {
      return res.status(400).json({ message: 'Tên và Email là bắt buộc' });
    }

    let cv;
    if (cvId) {
      // Nếu có ID -> Cập nhật
      cv = await CV.findOneAndUpdate(
        { _id: cvId, user: userId },
        { title, design, data },
        { new: true }
      );
    } else {
      // Nếu không -> Tạo mới
      cv = new CV({ user: userId, title, design, data });
      await cv.save();
    }

    res.status(200).json({ message: 'Lưu CV thành công', cv });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lưu CV' });
  }
};

// [GET] Lấy danh sách CV của User
exports.getMyCVs = async (req, res) => {
  try {
    const cvs = await CV.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json(cvs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};