const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedCandidate = async () => {
  try {
    const candidateEmail = 'candidate@test.com';
    const candidateExists = await User.findOne({ email: candidateEmail });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    if (!candidateExists) {
      await User.create({
        fullName: 'Nguyen Van Candidate',
        email: candidateEmail, 
        password: hashedPassword,
        role: 'candidate',
        status: 'active',
        isVerified: true,
        title: 'Node.js Developer',
        phone: '0987654321',
        address: 'Hanoi, Vietnam',
        aboutMe: 'I am a software engineer specializing in backend development.',
        skills: ['JavaScript', 'Node.js', 'Express', 'MongoDB']
      });

      console.log('=======> 🎉 Đã khởi tạo tài khoản Candidate test thành công !');
    } else {
      // Always reset password, status and isVerified in dev environment
      candidateExists.password = hashedPassword;
      candidateExists.status = 'active';
      candidateExists.isVerified = true;
      await candidateExists.save();
      console.log('=======> Candidate test đã tồn tại, đã đồng bộ lại mật khẩu và trạng thái hoạt động.');
    }
  } catch (error) {
    console.error('Lỗi khi chạy seed Candidate:', error);
  }
};

module.exports = seedCandidate;
