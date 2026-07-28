// File: backend/controllers/application.controller.js
const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const Assessment = require('../models/Assessment'); 
const aiService = require('../services/ai.service');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');
const path = require('path');
const CVReview = require('../models/CVReview');

let pdfParse;
try {
    pdfParse = require('pdf-parse');
} catch (err) {
    console.warn("⚠️ Vui lòng chạy lệnh: npm install pdf-parse để AI có thể đọc nội dung file PDF.");
}

async function extractTextFromCV(reqFile, appliedCvId, user) {
    let text = `Hồ sơ ứng viên: ${user?.fullName}. Kỹ năng: ${user?.skills?.join(', ') || 'Chưa cập nhật'}`;
    try {
        if (reqFile && pdfParse) {
            const dataBuffer = fs.readFileSync(reqFile.path);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (appliedCvId) {
            text = `CV Hệ thống Careerio. Ứng viên: ${user?.fullName}, Kỹ năng: ${user?.skills?.join(', ')}, Giới thiệu: ${user?.aboutMe || ''}`;
        } else if (user?.cvUrl && user.cvUrl.endsWith('.pdf') && pdfParse) {
            const filePath = path.join(__dirname, '..', user.cvUrl);
            if (fs.existsSync(filePath)) {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                text = data.text;
            }
        }
    } catch (err) { console.error("Lỗi trích xuất Text từ CV:", err.message); }
    return text;
}

exports.previewCVMatch = async (req, res) => {
  try {
    const { jobId, appliedCvId } = req.body;
    const userId = req.user?.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy công việc' });

    const user = await User.findById(userId);
    const cvTextForAI = await extractTextFromCV(req.file, appliedCvId, user);
    const jobDescription = `Tiêu đề: ${job.title}\nMô tả: ${job.description}\nYêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements}`;

    const aiResult = await aiService.calculateJobMatch(cvTextForAI, jobDescription);

    if (aiResult && typeof aiResult.score === 'number') {
        await CVReview.create({
            userId, jobId, score: aiResult.score, verdict: aiResult.verdict, pros: aiResult.pros || [], cons: aiResult.cons || [], advice: aiResult.advice
        });
    }

    return res.status(200).json({ message: 'Phân tích thành công', aiResult: aiResult });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi phân tích CV' });
  }
};

exports.getReviewHistory = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.id;
        const history = await CVReview.find({ userId, jobId }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy lịch sử review' }); }
};

// ======================================================================
// API NỘP CV CHÍNH THỨC - ĐÃ FIX LOGIC 3 LẦN
// ======================================================================
exports.createApplication = async (req, res) => {
  try {
    const { jobId, appliedCvId, preEvaluatedAI } = req.body;
    const userId = req.user?.id;

    if (!jobId) return res.status(400).json({ message: 'jobId là bắt buộc' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Công việc không tồn tại' });

    // ✅ FIX TẠI ĐÂY: Cho phép tối đa 3 lần nộp cho cùng 1 Job
    const existingCount = await Application.countDocuments({ jobId, userId });
    if (existingCount >= 3) {
        return res.status(400).json({ message: 'Bạn đã đạt giới hạn 3 lần ứng tuyển cho công việc này. Không thể nộp thêm.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    let appliedCvFileUrl = '';
    if (req.file) {
      appliedCvFileUrl = `/uploads/cvs/${req.file.filename}`;
      user.cvUrl = appliedCvFileUrl;
      await user.save();
    } else if (appliedCvId) {
      appliedCvFileUrl = appliedCvId; 
    } else if (user.cvUrl) {
      appliedCvFileUrl = user.cvUrl;
    }

    if (!appliedCvFileUrl) return res.status(400).json({ message: 'Vui lòng cung cấp CV để ứng tuyển' });

    let aiEvaluation = { score: 0, matched: [], missing: [], advice: "Chưa thể đánh giá AI lúc này." };
    
    if (preEvaluatedAI) {
        try {
            const parsedAI = JSON.parse(preEvaluatedAI);
            aiEvaluation = {
                score: parsedAI.score || 0,
                matched: parsedAI.pros || parsedAI.matched || [],
                missing: parsedAI.cons || parsedAI.missing || [],
                advice: parsedAI.advice || ''
            };
        } catch (e) { console.error(e); }
    } else {
        try {
            const cvTextForAI = await extractTextFromCV(req.file, appliedCvId, user);
            aiEvaluation = await aiService.evaluateCVMatch(job, cvTextForAI);
        } catch (aiErr) {}
    }

    let hasTest = false;
    let assessmentId = null;
    try {
        const assessment = await Assessment.findOne({ jobId: jobId, status: 'PUBLISHED' });
        if (assessment) {
            hasTest = true;
            assessmentId = assessment._id;
        }
    } catch (testErr) {}

    const application = await Application.create({
      jobId, userId, appliedCvId: appliedCvId || null, appliedCvFileUrl, status: 'Applied',
      aiScore: aiEvaluation.score || 0,
      aiMatchDetails: { matched: aiEvaluation.matched || [], missing: aiEvaluation.missing || [], advice: aiEvaluation.advice || '' },
      hasTest: hasTest,
      assessmentId: assessmentId 
    });

    const populatedApplication = await Application.findById(application._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');

    return res.status(201).json({
      message: 'Ứng tuyển thành công', data: populatedApplication, aiResult: aiEvaluation, hasTest: hasTest, assessmentId: assessmentId
    });

  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi ứng tuyển', detail: error.message });
  }
};

// ... Các hàm list, getById, updateStatus, sendNotification, getStatsSummary, getMyTestHistory giữ nguyên ...
exports.list = async (req, res) => {
  try {
    const { jobId, status, search, page = 1, limit = 20, sort = '-appliedAt' } = req.query;
    const user = req.user || {};
    const q = {};

    if (user.role === 'business') {
      const jobs = await Job.find({ recruiterId: user.id }).select('_id');
      const jobIds = jobs.map((j) => j._id.toString());
      if (jobId) {
        if (!jobIds.includes(jobId.toString())) return res.status(403).json({ message: 'Access denied' });
        q.jobId = jobId;
      } else q.jobId = { $in: jobIds };
    } else if (user.role === 'candidate') {
      q.userId = user.id;
      if (jobId) q.jobId = jobId;
    } else {
      if (jobId) q.jobId = jobId;
    }

    if (status) q.status = status;

    if (search) {
      const users = await User.find({ fullName: new RegExp(search, 'i') }).select('_id');
      const ids = users.map((u) => u._id);
      if (ids.length === 0) return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
      q.userId = { $in: ids };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Application.countDocuments(q);

    const items = await Application.find(q)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate({ path: 'jobId', select: 'title recruitmentDeadline recruiterId', populate: { path: 'recruiterId', select: 'fullName companyName' } })
      .sort(sort).skip(skip).limit(Number(limit));

    return res.json({ data: items, total, page: Number(page), limit: Number(limit) });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.getById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title description recruiterId');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (req.user?.role === 'business' && app.jobId?.recruiterId?.toString() !== req.user.id.toString()) return res.status(403).json({ message: 'Access denied' });
    return res.json(app);
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

    const app = await Application.findById(id).populate('jobId');
    if (!app) return res.status(404).json({ message: 'Không tìm thấy' });
    if (req.user?.role === 'business' && app.jobId?.recruiterId?.toString() !== req.user.id.toString()) return res.status(403).json({ message: 'Không có quyền' });

    app.status = status;
    await app.save();

    const updatedApp = await Application.findById(id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');

    try {
      const statusNamesVi = { Applied: 'Hồ sơ mới nộp', Testing: 'Làm bài kiểm tra', Interviewing: 'Đang phỏng vấn', Offered: 'Đề nghị nhận việc (Offer)', Rejected: 'Đã từ chối' };
      await Notification.create({ userId: app.userId, title: 'Cập nhật trạng thái ứng tuyển', message: `Hồ sơ cho vị trí "${app.jobId?.title}" đã chuyển sang trạng thái: ${statusNamesVi[status] || status}.`, type: 'status_change', relatedApplicationId: app._id });
    } catch (notifErr) {}

    return res.json({ message: 'Cập nhật thành công', data: updatedApp });
  } catch (error) { res.status(500).json({ message: 'Lỗi máy chủ' }); }
};

exports.sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content, type } = req.body;
    if (!subject || !content) return res.status(400).json({ message: 'Thiếu thông tin' });

    const app = await Application.findById(id).populate('userId').populate('jobId');
    if (!app) return res.status(404).json({ message: 'Không tìm thấy' });
    if (req.user?.role === 'business' && app.jobId?.recruiterId?.toString() !== req.user.id.toString()) return res.status(403).json({ message: 'Không có quyền' });
    if (!app.userId?.email) return res.status(400).json({ message: 'Không có email' });

    try { await sendEmail(app.userId.email, subject, `<div style="padding: 24px;">${content.replace(/\n/g, '<br/>')}</div>`); } catch (err) {}

    app.mailSentStatus = type === 'Pass' ? 'Sent_Pass' : type === 'Reject' ? 'Sent_Reject' : (app.status === 'Rejected' ? 'Sent_Reject' : 'Sent_Pass');
    await app.save();

    try { await Notification.create({ userId: app.userId._id, title: subject, message: content, type: 'general', relatedApplicationId: app._id }); } catch (err) {}

    return res.json({ message: 'Gửi thành công', mailSentStatus: app.mailSentStatus });
  } catch (error) { res.status(500).json({ message: 'Lỗi' }); }
};

exports.getStatsSummary = async (req, res) => {
  try {
    const user = req.user || {};
    const q = {};
    if (user.role === 'business') {
      const jobs = await Job.find({ recruiterId: user.id }).select('_id');
      q.jobId = { $in: jobs.map((j) => j._id) };
    }
    const totalJobs = user.role === 'business' ? await Job.countDocuments({ recruiterId: user.id }) : await Job.countDocuments();
    const totalApplications = await Application.countDocuments(q);
    const statusCounts = await Application.aggregate([{ $match: q }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
    const statsObj = { Applied: 0, Testing: 0, Interviewing: 0, Offered: 0, Rejected: 0 };
    statusCounts.forEach((item) => { if (statsObj[item._id] !== undefined) statsObj[item._id] = item.count; });
    const avgScoreResult = await Application.aggregate([{ $match: q }, { $group: { _id: null, avgScore: { $avg: '$aiScore' } } }]);
    const avgAiScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;
    const trendResult = await Application.aggregate([{ $match: q }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 10 }]);

    return res.json({ totalJobs, totalApplications, statusCounts: statsObj, avgAiScore, trend: trendResult });
  } catch (error) { res.status(500).json({ message: 'Lỗi' }); }
};

exports.getMyTestHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await Application.find({ userId, testStatus: 'Completed' })
            .populate('jobId', 'title companyName')
            .populate('assessmentId', 'assessmentName timeLimit questions')
            .sort({ testSubmittedAt: -1 })
            .lean();
        res.status(200).json(history);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy lịch sử bài test' }); }
};