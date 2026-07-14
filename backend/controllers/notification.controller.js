const Notification = require('../models/Notification');

// GET /api/notifications
exports.list = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(notifications);
  } catch (error) {
    console.error('List notifications error:', error);
    return res.status(500).json({ message: 'Lỗi lấy danh sách thông báo' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, userId: req.user.id });
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    notification.isRead = true;
    await notification.save();
    return res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ message: 'Lỗi cập nhật trạng thái thông báo' });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ message: 'Lỗi cập nhật tất cả thông báo' });
  }
};
