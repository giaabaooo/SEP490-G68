const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const Assessment = require('../models/Assessment'); 
const aiService = require('../services/ai.service');
const sendEmail = require('../utils/sendEmail');
const { createNotification } = require('../utils/notificationHelper');
const fs = require('fs');
const path = require('path');
const CVReview = require('../models/CVReview');
const CV = require('../models/CV');

let pdfParseModule;
try { pdfParseModule = require('pdf-parse'); } catch (err) { console.warn("⚠️ Không tìm thấy thư viện pdf-parse."); }

async function extractTextFromCV(reqFile, appliedCvId, user, appliedCvFileUrl = null) {
    let text = `Hồ sơ ứng viên: ${user?.fullName}. Kỹ năng: ${user?.skills?.join(', ') || 'Chưa cập nhật'}`;
    try {
        let dataBuffer = null;
        if (reqFile) { 
            dataBuffer = fs.readFileSync(reqFile.path); 
        } else {
            const pdfUrl = appliedCvFileUrl || user?.cvUrl;
            if (pdfUrl && String(pdfUrl).toLowerCase().endsWith('.pdf')) {
                const relativePath = pdfUrl.startsWith('/') ? pdfUrl.slice(1) : pdfUrl;
                const filePath = path.join(__dirname, '..', relativePath);
                if (fs.existsSync(filePath)) dataBuffer = fs.readFileSync(filePath);
            }
        }

        if (dataBuffer && pdfParseModule) {
            if (typeof pdfParseModule === 'function') {
                const data = await pdfParseModule(dataBuffer);
                if (data && data.text) text = data.text;
            } else if (pdfParseModule.PDFParse) {
                const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
                const result = await parser.getText();
                if (result && result.text) text = result.text;
                else if (typeof result === 'string') text = result;
            }
        } else if (appliedCvId) {
            try {
                const onlineCv = await CV.findById(appliedCvId);
                if (onlineCv && onlineCv.data) {
                    const d = onlineCv.data;
                    const edu = (d.education || []).map(e => `${e.school || ''} ${e.major || ''} ${e.description || ''}`).join('; ');
                    const exp = (d.experience || []).map(e => `${e.company || ''} ${e.position || ''} ${e.description || ''}`).join('; ');
                    const act = (d.activities || []).map(a => `${a.organization || ''} ${a.role || ''} ${a.description || ''}`).join('; ');
                    const cert = (d.certificates || []).map(c => c.name || '').join(', ');
                    text = `Hồ sơ ứng viên: ${d.personal?.fullName || user?.fullName}. Vị trí: ${d.personal?.jobTitle || ''}. Mục tiêu: ${d.objective || ''}. Kỹ năng chuyên môn: ${d.skills || ''}. Kinh nghiệm làm việc: ${exp}. Quá trình học vấn: ${edu}. Hoạt động: ${act}. Chứng chỉ: ${cert}. Sở thích: ${d.hobbies || ''}.`;
                }
            } catch (cvErr) {
                text = `CV Hệ thống Careerio. Ứng viên: ${user?.fullName}, Kỹ năng: ${user?.skills?.join(', ')}, Giới thiệu: ${user?.aboutMe || ''}`;
            }
        }
    } catch (err) { console.error("Lỗi trích xuất Text từ CV:", err.message); }
    return text;
}

exports.previewCVMatch = async (req, res) => {
  try {
    const { jobId, appliedCvId } = req.body;
    const userId = req.user?.id;
    const user = await User.findById(userId);

    // 1. CHỈ KIỂM TRA HẠN MỨC ỨNG VIÊN
    if (req.user?.role === 'candidate') {
        const now = new Date();
        // Kiểm tra hết hạn gói Pro
        if (user.subscription?.plan === 'pro' && user.subscription.endDate && now > new Date(user.subscription.endDate)) {
            user.subscription.plan = 'free';
        }

        // Kiểm tra chu kỳ reset 30 ngày
        const lastReset = new Date(user.subscription?.usage?.lastResetDate || now);
        if (now - lastReset > 30 * 24 * 60 * 60 * 1000) {
            if (!user.subscription.usage) user.subscription.usage = {};
            user.subscription.usage.cvReviewCount = 0;
            user.subscription.usage.mockInterviewMinutes = 0;
            user.subscription.usage.roadmapCount = 0;
            user.subscription.usage.lastResetDate = now;
        }

        const isPro = user.subscription?.plan === 'pro' && user.subscription?.endDate && new Date(user.subscription.endDate) > now;
        const limit = isPro ? 50 : 2;
        const currentUsage = user.subscription?.usage?.cvReviewCount || 0;
        
        if (currentUsage >= limit) {
            return res.status(403).json({ message: `Bạn đã hết số lượt AI Review CV của tháng này (${currentUsage}/${limit} lượt). Vui lòng Nâng cấp gói Pro để tiếp tục!` });
        }
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy công việc' });

    const cvTextForAI = await extractTextFromCV(req.file, appliedCvId, user);
    const jobDescription = `Tiêu đề: ${job.title}\nMô tả: ${job.description}\nYêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements}`;

    // 2. GỌI AI PHÂN TÍCH
    const aiResult = await aiService.calculateJobMatch(cvTextForAI, jobDescription);

    // 3. AI THÀNH CÔNG -> LƯU DATA VÀ TRỪ LƯỢT DÙNG CỦA ỨNG VIÊN
    if (aiResult && typeof aiResult.score === 'number') {
        if (req.user?.role === 'candidate') {
            if (!user.subscription.usage) user.subscription.usage = {};
            user.subscription.usage.cvReviewCount = (user.subscription.usage.cvReviewCount || 0) + 1;
            await user.save();
        }

        await CVReview.create({
            userId, jobId, score: aiResult.score, verdict: aiResult.verdict, pros: aiResult.pros || [], cons: aiResult.cons || [], advice: aiResult.advice
        });
    }

    return res.status(200).json({ message: 'Phân tích thành công', aiResult: aiResult });
  } catch (error) { return res.status(500).json({ message: 'Lỗi máy chủ khi phân tích CV' }); }
};

exports.getReviewHistory = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.id;
        const history = await CVReview.find({ userId, jobId }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy lịch sử review' }); }
};

exports.createApplication = async (req, res) => {
  try {
    const { jobId, appliedCvId } = req.body;
    const userId = req.user?.id;
    if (!jobId) return res.status(400).json({ message: 'jobId là bắt buộc' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Công việc không tồn tại' });
    if (job.status === 'closed') return res.status(400).json({ message: 'Công việc này đã đóng.' });
    if (job.recruitmentDeadline && new Date(job.recruitmentDeadline).getTime() < new Date().getTime()) return res.status(400).json({ message: 'Đã hết hạn ứng tuyển.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const existingApp = await Application.findOne({ jobId, userId });
    if (existingApp) {
        const currentCount = existingApp.applyCount || 1;
        if (currentCount >= 3) return res.status(400).json({ message: 'Đạt giới hạn 3 lần ứng tuyển cho công việc này.' });
        if (['Interviewing', 'Offered'].includes(existingApp.status)) return res.status(400).json({ message: 'Hồ sơ đang ở vòng trong, không thể nộp lại.' });
    }

    let appliedCvFileUrl = '';
    if (req.file) { 
        appliedCvFileUrl = `/uploads/cvs/${req.file.filename}`; 
        user.cvUrl = appliedCvFileUrl; 
        await user.save(); 
    } 
    else if (appliedCvId) { 
        appliedCvFileUrl = `/api/cv/view/${appliedCvId}`; 
    } 
    else if (user.cvUrl) { 
        appliedCvFileUrl = user.cvUrl; 
    }
    if (!appliedCvFileUrl) return res.status(400).json({ message: 'Vui lòng cung cấp CV' });

    let aiEvaluation = { score: 0, categoryScores: [], reasonToHire: "", reasonToReject: "", advice: "" };
    
    if (job.useAiReview === false) {
         aiEvaluation.advice = "Nhà tuyển dụng tắt chế độ tự động chấm AI. Hồ sơ sẽ được duyệt thủ công.";
    } else {
        try {
            const businessUser = await User.findById(job.recruiterId);
            
            // 1. KIỂM TRA SỐ DƯ DOANH NGHIỆP TRƯỚC
            if (!businessUser || (businessUser.businessCredits?.balance || 0) < 30) {
                aiEvaluation.advice = "Nhà tuyển dụng tạm thời hết Token để nhận kết quả AI.";
            } else {
                // 2. GỌI AI PHÂN TÍCH CV
                const cvTextForAI = await extractTextFromCV(req.file, appliedCvId, user, appliedCvFileUrl);
                aiEvaluation = await aiService.evaluateCVMatch(job, cvTextForAI);
                
                // 3. AI CHẠY THÀNH CÔNG -> TRỪ 30 TOKEN CỦA DOANH NGHIỆP
                if (aiEvaluation.score > 0 || aiEvaluation.verdict !== "Lỗi Server") {
                    businessUser.businessCredits.balance -= 30;
                    await businessUser.save();
                }
            }
        } catch (aiErr) {
            console.error("Lỗi AI khi nộp trực tiếp:", aiErr.message);
            aiEvaluation.advice = "Hệ thống AI tạm thời đang bận, hồ sơ sẽ được lưu lại.";
        }
    }

    let hasTest = false;
    let assessmentId = null;
    try {
        const assessment = await Assessment.findOne({ jobId: jobId, status: 'PUBLISHED' });
        if (assessment) { hasTest = true; assessmentId = assessment._id; }
    } catch (testErr) {}

    let populatedApplication;

    if (existingApp) {
        await Application.findOneAndUpdate(
            { _id: existingApp._id },
            { 
                $set: { 
                    appliedCvId: appliedCvId || null, appliedCvFileUrl: appliedCvFileUrl,
                    aiScore: aiEvaluation.score || 0,
                    aiMatchDetails: { reasonToHire: aiEvaluation.reasonToHire || '', reasonToReject: aiEvaluation.reasonToReject || '', categoryScores: aiEvaluation.categoryScores || [], verdict: aiEvaluation.verdict || '' },
                    status: 'Applied', appliedAt: Date.now() 
                },
                $inc: { applyCount: 1 }
            },
            { strict: false }
        );
        populatedApplication = await Application.findById(existingApp._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');
        
        // Gửi thông báo cho ứng viên & nhà tuyển dụng
        await createNotification({
            userId,
            title: 'Cập nhật hồ sơ ứng tuyển thành công!',
            message: `Bạn đã cập nhật hồ sơ ứng tuyển vị trí "${job.title}". Hãy theo dõi tiến trình phản hồi từ nhà tuyển dụng.`,
            type: 'application_submitted',
            link: '/candidate/applications',
            relatedApplicationId: existingApp._id
        });
        if (job.recruiterId) {
            await createNotification({
                userId: job.recruiterId,
                title: 'Ứng viên cập nhật hồ sơ ứng tuyển',
                message: `Ứng viên ${user.fullName} vừa cập nhật lại hồ sơ cho vị trí "${job.title}".`,
                type: 'application_submitted',
                link: `/bussiness/jobs/${job._id}/cvs`,
                relatedApplicationId: existingApp._id
            });
        }

        return res.status(200).json({ message: 'Đã cập nhật lại hồ sơ thành công', data: populatedApplication, hasTest: hasTest, assessmentId: assessmentId });
    } else {
        const application = await Application.create({
          jobId, userId, appliedCvId: appliedCvId || null, appliedCvFileUrl, status: 'Applied', aiScore: aiEvaluation.score || 0,
          aiMatchDetails: { reasonToHire: aiEvaluation.reasonToHire || '', reasonToReject: aiEvaluation.reasonToReject || '', categoryScores: aiEvaluation.categoryScores || [], verdict: aiEvaluation.verdict || '' },
          hasTest: hasTest, assessmentId: assessmentId 
        });
        await Application.updateOne({ _id: application._id }, { $set: { applyCount: 1 } }, { strict: false });
        populatedApplication = await Application.findById(application._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');

        // Gửi thông báo cho ứng viên & nhà tuyển dụng
        await createNotification({
            userId,
            title: 'Ứng tuyển thành công!',
            message: `Bạn đã nộp hồ sơ thành công vào vị trí "${job.title}". Hãy theo dõi tiến trình tuyển dụng tại đây.`,
            type: 'application_submitted',
            link: '/candidate/applications',
            relatedApplicationId: application._id
        });
        if (job.recruiterId) {
            await createNotification({
                userId: job.recruiterId,
                title: 'Hồ sơ ứng tuyển mới',
                message: `Ứng viên ${user.fullName} vừa nộp hồ sơ vào vị trí "${job.title}".`,
                type: 'application_submitted',
                link: `/bussiness/jobs/${job._id}/cvs`,
                relatedApplicationId: application._id
            });
        }

        return res.status(201).json({ message: 'Ứng tuyển thành công', data: populatedApplication, hasTest: hasTest, assessmentId: assessmentId });
    }
  } catch (error) { return res.status(500).json({ message: 'Lỗi máy chủ khi ứng tuyển', detail: error.message }); }
};

exports.list = async (req, res) => {
  try {
    const { jobId, status, search, page = 1, limit = 20, sort = '-appliedAt' } = req.query;
    const user = req.user || {};
    const q = {};

    if (user.role === 'business') {
      const jobs = await Job.find({ recruiterId: user.id }).select('_id');
      const jobIds = jobs.map((j) => j._id.toString());
      if (jobId) { if (!jobIds.includes(jobId.toString())) return res.status(403).json({ message: 'Access denied' }); q.jobId = jobId; } 
      else q.jobId = { $in: jobIds };
    } else if (user.role === 'candidate') {
      q.userId = user.id; if (jobId) q.jobId = jobId;
    } else { if (jobId) q.jobId = jobId; }

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

    // Chuẩn hóa appliedCvFileUrl cho cả các application cũ
    const formattedItems = items.map(app => {
      const doc = app.toObject();
      if (doc.appliedCvId && (!doc.appliedCvFileUrl || !doc.appliedCvFileUrl.includes('/'))) {
        doc.appliedCvFileUrl = `/api/cv/view/${doc.appliedCvId}`;
      } else if (doc.appliedCvFileUrl && /^[0-9a-fA-F]{24}$/.test(doc.appliedCvFileUrl)) {
        doc.appliedCvFileUrl = `/api/cv/view/${doc.appliedCvFileUrl}`;
      }
      return doc;
    });

    return res.json({ data: formattedItems, total, page: Number(page), limit: Number(limit) });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.getById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title description recruiterId');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (req.user?.role === 'business' && app.jobId?.recruiterId?.toString() !== req.user.id.toString()) return res.status(403).json({ message: 'Access denied' });
    
    const doc = app.toObject();
    if (doc.appliedCvId && (!doc.appliedCvFileUrl || !doc.appliedCvFileUrl.includes('/'))) {
      doc.appliedCvFileUrl = `/api/cv/view/${doc.appliedCvId}`;
    } else if (doc.appliedCvFileUrl && /^[0-9a-fA-F]{24}$/.test(doc.appliedCvFileUrl)) {
      doc.appliedCvFileUrl = `/api/cv/view/${doc.appliedCvFileUrl}`;
    }
    return res.json(doc);
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

    app.status = status; await app.save();
    const updatedApp = await Application.findById(id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');

    try {
      const statusNamesVi = { Applied: 'Hồ sơ mới nộp', Testing: 'Làm bài kiểm tra', Interviewing: 'Đang phỏng vấn', Offered: 'Đề nghị nhận việc (Offer)', Rejected: 'Đã từ chối' };
const { createNotification } = require('../utils/notificationHelper');
      await Notification.create({ userId: app.userId, title: 'Cập nhật trạng thái ứng tuyển', message: `Hồ sơ cho vị trí "${app.jobId?.title}" đã chuyển sang trạng thái: ${statusNamesVi[status] || status}.`, type: 'status_change', link: '/candidate/applications', relatedApplicationId: app._id });
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

    try { await Notification.create({ userId: app.userId._id, title: subject, message: content, type: 'general', link: '/candidate/applications', relatedApplicationId: app._id }); } catch (err) {}

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
        const history = await Application.find({ userId, testStatus: 'Completed' }).populate('jobId', 'title companyName').populate('assessmentId', 'assessmentName timeLimit questions').sort({ testSubmittedAt: -1 }).lean();
        res.status(200).json(history);
    } catch (error) { res.status(500).json({ message: 'Lỗi lấy lịch sử bài test' }); }
};

exports.reEvaluate = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('jobId').populate('userId');
    if (!application) return res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng viên' });

    const job = await Job.findById(application.jobId?._id || application.jobId);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy thông tin công việc' });

    if (req.user?.role === 'business' && String(job.recruiterId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Bạn không có quyền đánh giá hồ sơ này' });
    }

    const cvTextForAI = await extractTextFromCV(null, application.appliedCvId, application.userId, application.appliedCvFileUrl);
    const aiEvaluation = await aiService.evaluateCVMatch(job, cvTextForAI);

    application.aiScore = aiEvaluation.score || 0;
    application.aiMatchDetails = {
      reasonToHire: aiEvaluation.reasonToHire || '',
      reasonToReject: aiEvaluation.reasonToReject || '',
      categoryScores: aiEvaluation.categoryScores || [],
      verdict: aiEvaluation.verdict || '',
      advice: aiEvaluation.advice || ''
    };

    await application.save();

    const populatedApp = await Application.findById(application._id)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title recruitmentDeadline');

    return res.json({
      message: 'Đã phân tích và chấm lại hồ sơ theo Bands thành công!',
      data: populatedApp
    });
  } catch (error) {
    console.error('Lỗi reEvaluate:', error);
    return res.status(500).json({ message: 'Lỗi khi chấm lại hồ sơ: ' + error.message });
  }
};