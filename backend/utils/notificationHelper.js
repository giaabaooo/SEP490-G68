const Notification = require('../models/Notification');
const mongoose = require('mongoose');

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
    if (!userId || !title || !message) return null;
    const cleanUserId = typeof userId === 'object' && userId._id ? userId._id : userId;
    if (!mongoose.isValidObjectId(cleanUserId)) return null;

    const notifData = {
      userId: cleanUserId,
      title: String(title).trim(),
      message: String(message).trim(),
      type: type || 'general',
      link: link ? String(link).trim() : ''
    };

    if (relatedApplicationId) {
      const cleanAppId = typeof relatedApplicationId === 'object' && relatedApplicationId._id 
        ? relatedApplicationId._id 
        : relatedApplicationId;
      if (mongoose.isValidObjectId(cleanAppId)) {
        notifData.relatedApplicationId = cleanAppId;
      }
    }

    return await Notification.create(notifData);
  } catch (err) {
    console.error('Lỗi khi tạo notification:', err.message);
    return null;
  }
};
