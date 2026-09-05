// File: backend/utils/notificationHelper.js
const Notification = require('../models/Notification');

/**
 * Tạo thông báo hệ thống cho người dùng
 * @param {Object} param0 
 * @param {string} param0.userId ID người nhận
 * @param {string} param0.title Tiêu đề thông báo
 * @param {string} param0.message Nội dung chi tiết
 * @param {string} [param0.type='general'] Loại thông báo
 * @param {string} [param0.link=''] Đường dẫn điều hướng khi click
 * @param {string} [param0.relatedApplicationId=null] ID hồ sơ ứng tuyển liên quan (nếu có)
 */
exports.createNotification = async ({ userId, title, message, type = 'general', link = '', relatedApplicationId = null }) => {
  try {
    if (!userId) return null;
    return await Notification.create({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
      link: link.trim(),
      relatedApplicationId
    });
  } catch (err) {
    console.error('Lỗi khi tạo notification:', err.message);
    return null;
  }
};
