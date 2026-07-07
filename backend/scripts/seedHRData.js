const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

const seedHRData = async () => {
  try {
    const hrEmail = 'hr@test.com';
    let hrUser = await User.findOne({ email: hrEmail });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    if (!hrUser) {
      hrUser = await User.create({
        fullName: 'HR Manager',
        email: hrEmail,
        password: hashedPassword,
        role: 'business',
        status: 'active',
        isVerified: true,
        companyName: 'Tech Solutions Co.',
        address: 'Hanoi, Vietnam',
        phone: '0123456789'
      });
      console.log('=======> 🎉 Đã khởi tạo tài khoản HR test thành công !');
    } else {
      hrUser.password = hashedPassword;
      hrUser.status = 'active';
      hrUser.isVerified = true;
      await hrUser.save();
      console.log('=======> Tài khoản HR đã được đồng bộ mật khẩu.');
    }

    // Seed mock candidate users if they do not exist
    const mockCandidates = [
      { email: 'candidate1@test.com', fullName: 'Nguyễn Văn Đạt' },
      { email: 'candidate2@test.com', fullName: 'Trần Thị Bình' },
      { email: 'candidate3@test.com', fullName: 'Lê Hoàng Nam' },
      { email: 'candidate4@test.com', fullName: 'Phạm Minh Tuấn' }
    ];

    const candidates = [];
    for (const c of mockCandidates) {
      let u = await User.findOne({ email: c.email });
      if (!u) {
        u = await User.create({
          fullName: c.fullName,
          email: c.email,
          password: hashedPassword,
          role: 'candidate',
          status: 'active',
          isVerified: true,
          title: 'Developer',
          phone: '0987654321',
          address: 'Vietnam',
          skills: ['JavaScript', 'HTML5', 'CSS3']
        });
      }
      candidates.push(u);
    }

    // Also get the seeded main candidate@test.com
    const mainCandidate = await User.findOne({ email: 'candidate@test.com' });
    if (mainCandidate) {
      candidates.push(mainCandidate);
    }

    // Seed mock Jobs if none exist
    let job1 = await Job.findOne({ title: 'Senior React Developer', recruiterId: hrUser._id });
    if (!job1) {
      job1 = await Job.create({
        recruiterId: hrUser._id,
        title: 'Senior React Developer',
        description: 'Xây dựng giao diện web sử dụng ReactJS và Tailwind CSS.',
        requirements: 'Ít nhất 3 năm kinh nghiệm lập trình React.',
        location: 'Hà Nội',
        salary: '1500 - 2500 USD'
      });
    }

    let job2 = await Job.findOne({ title: 'Node.js Backend Developer', recruiterId: hrUser._id });
    if (!job2) {
      job2 = await Job.create({
        recruiterId: hrUser._id,
        title: 'Node.js Backend Developer',
        description: 'Phát triển API RESTful và cấu trúc cơ sở dữ liệu MongoDB.',
        requirements: 'Thành thạo Express, Mongoose và Mạng máy tính.',
        location: 'Hồ Chí Minh',
        salary: '1200 - 2000 USD'
      });
    }

    // Seed applications if none exist
    const currentAppsCount = await Application.countDocuments({ jobId: { $in: [job1._id, job2._id] } });
    if (currentAppsCount === 0 && candidates.length > 0) {
      const statuses = ['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'];
      const aiScores = [85, 92, 78, 88, 45];
      const aiReasons = [
        'Kỹ năng lập trình tốt, phù hợp với yêu cầu.',
        'Đạt điểm đánh giá cao trong bài test kỹ thuật.',
        'Kinh nghiệm thực tiễn phong phú, thái độ tốt.',
        'Hoàn hảo cho vị trí Senior React Developer.',
        'Kinh nghiệm chưa đủ đáp ứng yêu cầu công việc.'
      ];

      // Match candidates to applications
      for (let i = 0; i < Math.min(candidates.length, 5); i++) {
        const candidate = candidates[i];
        const job = i % 2 === 0 ? job1 : job2;
        
        await Application.create({
          jobId: job._id,
          userId: candidate._id,
          aiScore: aiScores[i],
          aiReason: aiReasons[i],
          status: statuses[i],
          mailSentStatus: i === 3 ? 'Sent_Pass' : i === 4 ? 'Sent_Reject' : 'Pending',
          appliedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        });
      }
      console.log('=======> 🎉 Đã khởi tạo danh sách tin tuyển dụng và hồ sơ ứng viên mẫu thành công !');
    }
  } catch (error) {
    console.error('Lỗi khi chạy seed dữ liệu HR:', error);
  }
};

module.exports = seedHRData;
