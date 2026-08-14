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
const usageHelper = require('../utils/usageHelper');

// KHỞI TẠO ĐỌC MODULE
let pdfParseModule;
try {
    pdfParseModule = require('pdf-parse');
} catch (err) {
    console.warn("⚠️ Không tìm thấy thư viện pdf-parse.");
}

async function extractTextFromCV(reqFile, appliedCvId, user) {
    let text = `Hồ sơ ứng viên: ${user?.fullName}. Kỹ năng: ${user?.skills?.join(', ') || 'Chưa cập nhật'}`;
    try {
        let dataBuffer = null;

        // Xử lý lấy Buffer của file PDF
        if (reqFile) {
            dataBuffer = fs.readFileSync(reqFile.path);
        } else if (user?.cvUrl && user.cvUrl.endsWith('.pdf')) {
            const filePath = path.join(__dirname, '..', user.cvUrl);
            if (fs.existsSync(filePath)) {
                dataBuffer = fs.readFileSync(filePath);
            }
        }

        // ĐÃ FIX: HỖ TRỢ XỬ LÝ ĐỌC FILE CHO MỌI PHIÊN BẢN PDF-PARSE (BAO GỒM CẢ 2.4.5)
        if (dataBuffer && pdfParseModule) {
            if (typeof pdfParseModule === 'function') {
                // Dành cho bản cũ (v1.1.1)
                const data = await pdfParseModule(dataBuffer);
                if (data && data.text) text = data.text;
            } else if (pdfParseModule.PDFParse) {
                // Dành cho bản mới (v2.4.5+)
                const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
                const result = await parser.getText();
                if (result && result.text) {
                    text = result.text;
                } else if (typeof result === 'string') {
                    text = result;
                }
            } else {
                console.warn("Không nhận diện được hàm export của pdf-parse");
            }
        } else if (appliedCvId) {
            text = `CV Hệ thống Careerio. Ứng viên: ${user?.fullName}, Kỹ năng: ${user?.skills?.join(', ')}, Giới thiệu: ${user?.aboutMe || ''}`;
        }
    } catch (err) { 
        console.error("Lỗi trích xuất Text từ CV:", err.message); 
    }
    return text;
}

exports.previewCVMatch = async (req, res) => {
  try {
    const { jobId, appliedCvId } = req.body;
    const userId = req.user?.id;

    if (req.user?.role === 'candidate') {
      try {
        await usageHelper.checkCandidateLimit(userId, 'cv_review');
      } catch (err) {
        if (err.message === 'LIMIT_EXCEEDED') {
            return res.status(403).json({ message: "Bạn đã hết số lượt AI Review CV của tháng này. Vui lòng Nâng cấp gói Pro để tiếp tục!" });
        }
        throw err;
      }
    }

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
// API NỘP CV: ĐÃ CHUYỂN SANG UPDATE ĐỂ TRÁNH TRÙNG LẶP PIPELINE
// ======================================================================
exports.createApplication = async (req, res) => {
  try {
    const { jobId, appliedCvId } = req.body;
    const userId = req.user?.id;

    if (!jobId) return res.status(400).json({ message: 'jobId là bắt buộc' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Công việc không tồn tại' });
    if (job.status === 'closed') {
        return res.status(400).json({ message: 'Công việc này đã đóng, không thể ứng tuyển.' });
    }
    if (job.recruitmentDeadline && new Date(job.recruitmentDeadline).getTime() < new Date().getTime()) {
        return res.status(400).json({ message: 'Công việc này đã hết hạn ứng tuyển.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    // KIỂM TRA HỒ SƠ CŨ (Đã ứng tuyển job này chưa)
    const existingApp = await Application.findOne({ jobId, userId });
    
    if (existingApp) {
        const currentCount = existingApp.applyCount || 1;
        if (currentCount >= 3) {
            return res.status(400).json({ message: 'Bạn đã đạt giới hạn 3 lần ứng tuyển cho công việc này. Không thể nộp thêm.' });
        }
        if (['Interviewing', 'Offered'].includes(existingApp.status)) {
            return res.status(400).json({ message: 'Hồ sơ của bạn đang ở vòng trong, không thể nộp lại CV lúc này.' });
        }
    }

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

    let aiEvaluation = { score: 0, categoryScores: [], reasonToHire: "", reasonToReject: "", advice: "" };
    
    if (job.useAiReview === false) {
         aiEvaluation.advice = "Nhà tuyển dụng tắt chế độ tự động chấm AI. Hồ sơ sẽ được duyệt thủ công.";
    } else {
        try {
            const businessId = job.recruiterId;
            let canUseAI = false;
            try {
                await usageHelper.checkBusinessToken(businessId, 30);
                canUseAI = true; 
            } catch (tokenErr) {
                aiEvaluation.advice = "Nhà tuyển dụng tạm thời hết Token để nhận kết quả AI.";
            }

            if (canUseAI) {
                const cvTextForAI = await extractTextFromCV(req.file, appliedCvId, user);
                aiEvaluation = await aiService.evaluateCVMatch(job, cvTextForAI);
            }
        } catch (aiErr) {
            console.error("Lỗi AI khi nộp trực tiếp:", aiErr.message);
        }
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

    let populatedApplication;

    // NẾU ĐÃ TỪNG NỘP -> CHỈ CẬP NHẬT LẠI FILE VÀ ĐIỂM AI VÀO RECORD CŨ
    if (existingApp) {
        await Application.findOneAndUpdate(
            { _id: existingApp._id },
            { 
                $set: { 
                    appliedCvId: appliedCvId || null,
                    appliedCvFileUrl: appliedCvFileUrl,
                    aiScore: aiEvaluation.score || 0,
                    aiMatchDetails: { 
                        reasonToHire: aiEvaluation.reasonToHire || '', 
                        reasonToReject: aiEvaluation.reasonToReject || '', 
                        categoryScores: aiEvaluation.categoryScores || [],
                        verdict: aiEvaluation.verdict || ''
                    },
                    status: 'Applied', // Reset lại trạng thái về Applied để HR coi lại CV mới
                    appliedAt: Date.now() // Cập nhật ngày nộp mới nhất
                },
                $inc: { applyCount: 1 }
            },
            { strict: false }
        );
        populatedApplication = await Application.findById(existingApp._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');
        
        return res.status(200).json({
            message: 'Đã cập nhật lại hồ sơ thành công', data: populatedApplication, hasTest: hasTest, assessmentId: assessmentId
        });
    } 
    // NẾU CHƯA TỪNG NỘP -> TẠO MỚI
    else {
        const application = await Application.create({
          jobId, userId, appliedCvId: appliedCvId || null, appliedCvFileUrl, status: 'Applied',
          aiScore: aiEvaluation.score || 0,
          aiMatchDetails: { 
              reasonToHire: aiEvaluation.reasonToHire || '', 
              reasonToReject: aiEvaluation.reasonToReject || '', 
              categoryScores: aiEvaluation.categoryScores || [],
              verdict: aiEvaluation.verdict || ''
          },
          hasTest: hasTest,
          assessmentId: assessmentId 
        });

        await Application.updateOne({ _id: application._id }, { $set: { applyCount: 1 } }, { strict: false });

        populatedApplication = await Application.findById(application._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');

        return res.status(201).json({
          message: 'Ứng tuyển thành công', data: populatedApplication, hasTest: hasTest, assessmentId: assessmentId
        });
    }

  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi ứng tuyển', detail: error.message });
  }
};

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