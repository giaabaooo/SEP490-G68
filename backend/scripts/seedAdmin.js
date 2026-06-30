// Thay vì import, chuyển sang dùng require
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Đảm bảo đường dẫn này đúng với project của bạn

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt); // Mật khẩu mặc định của Admin

      await User.create({
        fullName: 'Administrator', // Sửa từ displayName thành fullName theo schema
        email: 'admin123@gmail.com', 
        password: hashedPassword,
        role: 'admin',
        status: 'active', // Sửa từ isApproved/isActive thành status: 'active'
        isVerified: true
      });

      console.log('=======> 🎉 Đã khởi tạo tài khoản Admin thành công !');
    } else {
      console.log('=======> Admin đã tồn tại, bỏ qua bước seeding.');
    }
  } catch (error) {
    console.error('Lỗi khi chạy seed Admin:', error);
  }
};

module.exports = seedAdmin;