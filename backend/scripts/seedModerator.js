const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedModerator = async () => {
  try {
    const email = "moderator@gmail.com";
    
    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    const hashPassword = await bcrypt.hash("123456", 10);

    if (!existingUser) {
      // TẠO MỚI: Cố định thẳng role là Moderator
      await User.create({
        fullName: "Chuyên Gia Đánh Giá (SME)",
        email: email,
        password: hashPassword,
        role: "business",
        subRole: "moderator", // Gắn quyền kiểm duyệt
        status: "active",
        isVerified: true,
      });
      console.log(`✅ Đã khởi tạo sẵn tài khoản Moderator: ${email} | Pass: 123456`);
    } else {
      // ĐÃ TỒN TẠI: Chỉ cập nhật pass và chốt cứng quyền, KHÔNG hạ cấp về candidate
      existingUser.password = hashPassword;
      existingUser.role = "business"; 
      existingUser.subRole = "moderator"; 
      existingUser.status = "active";
      existingUser.isVerified = true;
      
      await existingUser.save();
      console.log(`=======> Tài khoản Moderator (${email}) đã tồn tại và được giữ nguyên quyền kiểm duyệt.`);
    }
  } catch (error) {
    console.error("❌ Lỗi khi seed tài khoản Moderator:", error);
  }
};

module.exports = seedModerator;