const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const sendEmail = require('../utils/sendEmail');

// GET /api/applications
// Supports filtering by jobId, status, search (candidate name), pagination and sorting
exports.list = async (req, res) => {
  try {
    const {
      jobId,
      status,
      search,
      page = 1,
      limit = 20,
      sort = '-appliedAt',
    } = req.query;

    const user = req.user || {};

    const q = {};
    // If requester is a business (recruiter), restrict to their jobs only
    if (user.role === 'business') {
      // find job ids owned by this recruiter
      const jobs = await Job.find({ recruiterId: user.id }).select('_id');
      const jobIds = jobs.map((j) => j._id.toString());

      // If client requested a specific jobId, ensure it's owned by recruiter
      if (jobId) {
        if (!jobIds.includes(jobId.toString())) {
          return res.status(403).json({ message: 'Access denied to requested job applications' });
        }
        q.jobId = jobId;
      } else {
        q.jobId = { $in: jobIds };
      }
    } else {
      if (jobId) q.jobId = jobId;
    }
    if (status) q.status = status;

    // If search by candidate name, find matching users first
    if (search) {
      const users = await User.find({ fullName: new RegExp(search, 'i') }).select('_id');
      const ids = users.map((u) => u._id);
      // If no matching users, return empty result
      if (ids.length === 0) {
        return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
      }
      q.userId = { $in: ids };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Application.countDocuments(q);

    const items = await Application.find(q)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    return res.json({ data: items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('List applications error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findById(id)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title description recruiterId');

    const user = req.user || {};

    // If recruiter, ensure the application belongs to one of their jobs
    if (user.role === 'business') {
      if (!app) return res.status(404).json({ message: 'Application not found' });
      const recruiterId = app.jobId?.recruiterId?.toString();
      if (recruiterId !== user.id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!app) return res.status(404).json({ message: 'Application not found' });

    return res.json(app);
  } catch (error) {
    console.error('Get application error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/applications/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const app = await Application.findById(id).populate('jobId');
    if (!app) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }

    // Check permissions for business/recruiter role
    if (req.user && req.user.role === 'business') {
      const recruiterId = app.jobId?.recruiterId?.toString();
      if (recruiterId !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Không có quyền chỉnh sửa hồ sơ này' });
      }
    }

    app.status = status;
    await app.save();

    // Populate and return updated application
    const updatedApp = await Application.findById(id)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title');

    return res.json({
      message: 'Cập nhật trạng thái thành công',
      data: updatedApp
    });
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// POST /api/applications/:id/notify
exports.sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content, type } = req.body; // type: 'Pass' | 'Reject' | 'Info'

    if (!subject || !content) {
      return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const app = await Application.findById(id).populate('userId').populate('jobId');
    if (!app) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }

    // Check permissions
    if (req.user && req.user.role === 'business') {
      const recruiterId = app.jobId?.recruiterId?.toString();
      if (recruiterId !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Không có quyền gửi thông báo cho hồ sơ này' });
      }
    }

    if (!app.userId || !app.userId.email) {
      return res.status(400).json({ message: 'Ứng viên không có địa chỉ email' });
    }

    // Attempt to send email
    try {
      await sendEmail(
        app.userId.email,
        subject,
        `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); padding: 24px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800;">Careerio - Thông báo Tuyển dụng</h2>
          </div>
          <div style="padding: 24px;">
            ${content.replace(/\n/g, '<br/>')}
          </div>
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Đây là email tự động gửi từ hệ thống tuyển dụng Careerio. Vui lòng không trả lời trực tiếp email này.
          </div>
        </div>
        `
      );
    } catch (emailError) {
      console.warn("Nodemailer failed in development, printing email details instead:\n", {
        to: app.userId.email,
        subject,
        content
      });
      // Do not throw/crash in dev environment. Fallback to logging.
    }

    // Update mailSentStatus
    if (type === 'Pass') {
      app.mailSentStatus = 'Sent_Pass';
    } else if (type === 'Reject') {
      app.mailSentStatus = 'Sent_Reject';
    } else {
      app.mailSentStatus = app.status === 'Rejected' ? 'Sent_Reject' : 'Sent_Pass';
    }
    await app.save();

    return res.json({
      message: 'Gửi thông báo thành công',
      mailSentStatus: app.mailSentStatus
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return res.status(500).json({ message: 'Lỗi gửi email thông báo' });
  }
};

// GET /api/applications/stats/summary
exports.getStatsSummary = async (req, res) => {
  try {
    const user = req.user || {};
    const q = {};

    if (user.role === 'business') {
      const jobs = await Job.find({ recruiterId: user.id }).select('_id');
      const jobIds = jobs.map((j) => j._id.toString());
      q.jobId = { $in: jobIds };
    }

    // Total jobs
    const totalJobs = user.role === 'business' 
      ? await Job.countDocuments({ recruiterId: user.id })
      : await Job.countDocuments();

    // Total applications
    const totalApplications = await Application.countDocuments(q);

    // Status counts
    const statusCounts = await Application.aggregate([
      { $match: q },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statsObj = {
      Applied: 0,
      Testing: 0,
      Interviewing: 0,
      Offered: 0,
      Rejected: 0
    };
    statusCounts.forEach((item) => {
      if (statsObj[item._id] !== undefined) {
        statsObj[item._id] = item.count;
      }
    });

    // Average AI match score
    const avgScoreResult = await Application.aggregate([
      { $match: q },
      { $group: { _id: null, avgScore: { $avg: '$aiScore' } } }
    ]);
    const avgAiScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // Applications trend (grouped by date)
    const trendResult = await Application.aggregate([
      { $match: q },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    return res.json({
      totalJobs,
      totalApplications,
      statusCounts: statsObj,
      avgAiScore,
      trend: trendResult
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({ message: 'Lỗi lấy số liệu thống kê' });
  }
};

