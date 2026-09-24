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
const { uploadCvToCloudinary } = require('../utils/cloudinary');

let pdfParseModule;
try { pdfParseModule = require('pdf-parse'); } catch (err) { console.warn("⚠️ Không tìm thấy thư viện pdf-parse."); }

async function extractTextFromCV(reqFile, appliedCvId, user, appliedCvFileUrl = null) {
    let text = `Hồ sơ ứng viên: ${user?.fullName}. Kỹ năng: ${user?.skills?.join(', ') || 'Chưa cập nhật'}`;
    try {
        let dataBuffer = null;
        if (reqFile && reqFile.buffer) { 
            dataBuffer = reqFile.buffer; 
        } else if (reqFile && reqFile.path && fs.existsSync(reqFile.path)) {
            dataBuffer = fs.readFileSync(reqFile.path); 
        } else {
            const pdfUrl = appliedCvFileUrl || user?.cvUrl;
            if (pdfUrl) {
                if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
                    try {
                        const resp = await fetch(pdfUrl);
                        if (resp.ok) {
                            const arrayBuf = await resp.arrayBuffer();
                            dataBuffer = Buffer.from(arrayBuf);
                        }
                    } catch (fetchErr) {
                        console.error("Lỗi tải CV từ Cloudinary URL:", fetchErr.message);
                    }
                } else if (String(pdfUrl).toLowerCase().endsWith('.pdf')) {
                    const relativePath = pdfUrl.startsWith('/') ? pdfUrl.slice(1) : pdfUrl;
                    const filePath = path.join(__dirname, '..', relativePath);
                    if (fs.existsSync(filePath)) dataBuffer = fs.readFileSync(filePath);
                }
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
    if (job.status !== 'active') return res.status(400).json({ message: 'Công việc chưa được nhà tuyển dụng mở nhận hồ sơ.' });
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
        // Upload CV trực tiếp lên Cloudinary
        const uploadResult = await uploadCvToCloudinary(req.file.buffer, req.file.originalname, userId);
        appliedCvFileUrl = uploadResult.secure_url; 
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
    }

    let hasTest = false;
    let assessmentId = null;
    try {
        const assessment = await Assessment.findOne({ jobId: jobId, status: 'PUBLISHED' });
        if (assessment) { hasTest = true; assessmentId = assessment._id; }
    } catch (testErr) {}

    let populatedApplication;
    let targetApplicationId;

    if (existingApp) {
        targetApplicationId = existingApp._id;
        const updateFields = { 
            appliedCvId: appliedCvId || null, 
            appliedCvFileUrl: appliedCvFileUrl,
            aiScore: aiEvaluation.score || 0,
            aiMatchDetails: { 
                reasonToHire: aiEvaluation.reasonToHire || '', 
                reasonToReject: aiEvaluation.reasonToReject || '', 
                categoryScores: aiEvaluation.categoryScores || [], 
                verdict: aiEvaluation.verdict || '' 
            },
            appliedAt: Date.now(),
            hasTest: hasTest,
            assessmentId: assessmentId
        };
        if (existingApp.testStatus !== 'Completed') {
            updateFields.status = 'Applied';
        }

        await Application.findOneAndUpdate(
            { _id: existingApp._id },
            { 
                $set: updateFields,
                $inc: { applyCount: 1 }
            },
            { strict: false }
        );
        populatedApplication = await Application.findById(existingApp._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');
        
        // Gửi thông báo cho ứng viên
        await createNotification({
            userId,
            title: 'Cập nhật hồ sơ ứng tuyển thành công!',
            message: `Bạn đã cập nhật hồ sơ ứng tuyển vị trí "${job.title}". Hãy theo dõi tiến trình phản hồi từ nhà tuyển dụng.`,
            type: 'application_submitted',
            link: '/candidate/applications',
            relatedApplicationId: existingApp._id
        });
    } else {
        const application = await Application.create({
          jobId, userId, appliedCvId: appliedCvId || null, appliedCvFileUrl, 
          status: 'Applied', 
          aiScore: aiEvaluation.score || 0,
          aiMatchDetails: { 
              reasonToHire: aiEvaluation.reasonToHire || '', 
              reasonToReject: aiEvaluation.reasonToReject || '', 
              categoryScores: aiEvaluation.categoryScores || [], 
              verdict: aiEvaluation.verdict || '' 
          },
          hasTest: hasTest, assessmentId: assessmentId,
          testStatus: 'Not_Started'
        });
        await Application.updateOne({ _id: application._id }, { $set: { applyCount: 1 } }, { strict: false });
        targetApplicationId = application._id;
        populatedApplication = await Application.findById(application._id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title');

        // Gửi thông báo cho ứng viên
        await createNotification({
            userId,
            title: 'Ứng tuyển thành công!',
            message: `Bạn đã nộp hồ sơ thành công vào vị trí "${job.title}". Hãy theo dõi tiến trình tuyển dụng tại đây.`,
            type: 'application_submitted',
            link: '/candidate/applications',
            relatedApplicationId: application._id
        });
    }

    // XỬ LÝ BACKGROUND AI & THÔNG BÁO CHO NHÀ TUYỂN DỤNG (LUÔN PHÂN TÍCH TRÊN CV MỚI NHẤT TRONG NỀN)
    if (job.useAiReview !== false) {
        // Chạy AI ngầm trong nền không làm nghẽn phản hồi ứng tuyển, luôn phân tích trên CV vừa nộp
        const cachedFile = req.file ? { ...req.file, buffer: Buffer.from(req.file.buffer) } : null;
        setImmediate(async () => {
            try {
                const businessUser = await User.findById(job.recruiterId);
                if (!businessUser || (businessUser.businessCredits?.balance || 0) < 30) {
                    if (job.recruiterId) {
                        await createNotification({
                            userId: job.recruiterId,
                            title: `Hồ sơ ứng tuyển mới: ${user.fullName}`,
                            message: `Ứng viên ${user.fullName} vừa nộp hồ sơ vào vị trí "${job.title}". (Số dư Token của bạn không đủ để AI tự động chấm điểm).`,
                            type: 'application_submitted',
                            link: `/bussiness/candidate/${targetApplicationId}`,
                            relatedApplicationId: targetApplicationId
                        });
                    }
                    return;
                }

                const cvTextForAI = await extractTextFromCV(cachedFile, appliedCvId, user, appliedCvFileUrl);
                const bgAiEvaluation = await aiService.evaluateCVMatch(job, cvTextForAI);

                if (bgAiEvaluation.score > 0 || bgAiEvaluation.verdict !== "Lỗi Server") {
                    businessUser.businessCredits.balance -= 30;
                    await businessUser.save();
                }

                await Application.findByIdAndUpdate(targetApplicationId, {
                    $set: {
                        aiScore: bgAiEvaluation.score || 0,
                        aiMatchDetails: {
                            reasonToHire: bgAiEvaluation.reasonToHire || '',
                            reasonToReject: bgAiEvaluation.reasonToReject || '',
                            categoryScores: bgAiEvaluation.categoryScores || [],
                            verdict: bgAiEvaluation.verdict || ''
                        }
                    }
                });

                if (job.recruiterId) {
                    const scoreText = bgAiEvaluation.score !== undefined ? ` (AI Match: ${bgAiEvaluation.score}%)` : '';
                    const verdictText = bgAiEvaluation.verdict ? ` [${bgAiEvaluation.verdict}]` : '';
                    await createNotification({
                        userId: job.recruiterId,
                        title: `Hồ sơ ứng tuyển mới: ${user.fullName}${scoreText}`,
                        message: `Ứng viên ${user.fullName} vừa nộp hồ sơ vào vị trí "${job.title}". Điểm AI đánh giá CV: ${bgAiEvaluation.score || 0}/100${verdictText}. Bấm để xem chi tiết.`,
                        type: 'application_submitted',
                        link: `/bussiness/candidate/${targetApplicationId}`,
                        relatedApplicationId: targetApplicationId
                    });
                }
            } catch (bgErr) {
                console.error("Lỗi background AI evaluation:", bgErr.message);
                if (job.recruiterId) {
                    createNotification({
                        userId: job.recruiterId,
                        title: `Hồ sơ ứng tuyển mới: ${user.fullName}`,
                        message: `Ứng viên ${user.fullName} vừa nộp hồ sơ vào vị trí "${job.title}". Bấm để xem chi tiết.`,
                        type: 'application_submitted',
                        link: `/bussiness/candidate/${targetApplicationId}`,
                        relatedApplicationId: targetApplicationId
                    }).catch(() => {});
                }
            }
        });
    } else {
        // Nhà tuyển dụng tắt AI -> Gửi thông báo trực tiếp
        if (job.recruiterId) {
            createNotification({
                userId: job.recruiterId,
                title: `Hồ sơ ứng tuyển mới: ${user.fullName}`,
                message: `Ứng viên ${user.fullName} vừa nộp hồ sơ ứng tuyển vị trí "${job.title}". Bấm để xem chi tiết hồ sơ & CV.`,
                type: 'application_submitted',
                link: `/bussiness/candidate/${targetApplicationId}`,
                relatedApplicationId: targetApplicationId
            }).catch(e => console.warn("Lỗi gửi notification:", e.message));
        }
    }

    return res.status(201).json({ 
        message: existingApp ? 'Đã cập nhật lại hồ sơ thành công' : 'Ứng tuyển thành công', 
        data: populatedApplication, 
        hasTest: hasTest, 
        assessmentId: assessmentId 
    });
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
      .populate({ path: 'jobId', select: 'title recruitmentDeadline recruiterId requireTest assessmentId', populate: { path: 'recruiterId', select: 'fullName companyName' } })
      .populate('assessmentId', 'assessmentName timeLimit questions')
      .sort(sort).skip(skip).limit(Number(limit));

    // Chuẩn hóa appliedCvFileUrl cho cả các application cũ và đồng bộ bài test mới nhất nếu chưa nộp
    const formattedItems = items.map(app => {
      const doc = app.toObject();
      if (doc.jobId && doc.jobId.assessmentId && doc.testStatus !== 'Completed') {
        doc.assessmentId = doc.jobId.assessmentId;
      }
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
    const app = await Application.findById(req.params.id)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title description recruiterId requireTest assessmentId')
      .populate('assessmentId', 'assessmentName timeLimit questions');
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

const generateCandidateEmailHtml = ({ candidateName, jobTitle, companyName, title, message, actionUrl, actionText, type }) => {
  const isReject = type === 'Reject' || type === 'reject';
  const headerColor = isReject ? '#dc2626' : '#2563eb';
  const buttonColor = isReject ? '#64748b' : '#2563eb';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <tr>
        <td style="background-color: ${headerColor}; padding: 28px 32px; text-align: left;">
          <div style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">CAREERIO</div>
          <div style="color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500; margin-top: 4px;">Hệ thống Tuyển dụng & Đánh giá Năng lực</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${title}</h2>
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
            Xin chào <strong>${candidateName || 'Ứng viên'}</strong>,
          </p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #475569;">
              Vị trí ứng tuyển: <strong style="color: #0f172a;">${jobTitle || 'Vị trí đã nộp'}</strong>
              ${companyName ? `<br/>Đơn vị tuyển dụng: <strong style="color: #0f172a;">${companyName}</strong>` : ''}
            </p>
          </div>
          <div style="font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 28px;">
            ${message}
          </div>
          ${actionUrl ? `
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${actionUrl}" style="background-color: ${buttonColor}; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">
              ${actionText || 'Xem chi tiết'}
            </a>
          </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />
          <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            Đây là email tự động từ hệ thống Careerio gửi tới bạn. Chúc bạn có trải nghiệm tuyệt vời cùng nhà tuyển dụng!
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
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
    const updatedApp = await Application.findById(id).populate('userId', 'fullName avatar cvUrl email').populate('jobId', 'title recruiterId');

    const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

    try {
      const statusNamesVi = { 
        Applied: 'Hồ sơ mới nộp', 
        Testing: 'Làm bài kiểm tra', 
        Interviewing: 'Đang phỏng vấn', 
        Offered: 'Đề nghị nhận việc (Offer)', 
        Rejected: 'Đã từ chối' 
      };
      const statusDetailMsg = {
        Testing: `Hồ sơ của bạn cho vị trí "${updatedApp.jobId?.title}" đã được duyệt để làm bài test chuyên môn. Vui lòng truy cập hệ thống để làm bài kiểm tra.`,
        Interviewing: `Chúc mừng! Hồ sơ của bạn cho vị trí "${updatedApp.jobId?.title}" đã được chọn vào vòng Phỏng vấn. Nhà tuyển dụng sẽ sớm liên hệ lịch hẹn chi tiết với bạn.`,
        Offered: `Chúc mừng! Bạn đã nhận được lời mời nhận việc (Offer) cho vị trí "${updatedApp.jobId?.title}". Vui lòng đăng nhập hệ thống để xem chi tiết thông tin.`,
        Rejected: `Cảm ơn bạn đã quan tâm và ứng tuyển vị trí "${updatedApp.jobId?.title}". Sau khi cân nhắc kỹ lưỡng, hồ sơ của bạn chưa phù hợp với tiêu chí tuyển dụng trong đợt này. Chúc bạn sớm tìm được cơ hội phù hợp!`
      };

      await createNotification({ 
        userId: updatedApp.userId?._id || updatedApp.userId, 
        title: `Cập nhật trạng thái: ${statusNamesVi[status] || status}`, 
        message: statusDetailMsg[status] || `Hồ sơ cho vị trí "${updatedApp.jobId?.title}" đã chuyển sang trạng thái: ${statusNamesVi[status] || status}.`, 
        type: 'status_change', 
        link: '/candidate/applications', 
        relatedApplicationId: updatedApp._id 
      });

      if (updatedApp.userId?.email && ['Testing', 'Interviewing', 'Offered', 'Rejected'].includes(status)) {
        const actionUrl = status === 'Testing' && updatedApp.assessmentId 
          ? `${frontendUrl}/candidate/test/${updatedApp.assessmentId}`
          : `${frontendUrl}/candidate/applications`;
        const actionText = status === 'Testing' ? 'Vào làm bài Test ngay' : (status === 'Offered' ? 'Xem thư mời nhận việc' : 'Xem chi tiết hồ sơ');
        const emailHtml = generateCandidateEmailHtml({
          candidateName: updatedApp.userId?.fullName,
          jobTitle: updatedApp.jobId?.title,
          title: `Cập nhật trạng thái ứng tuyển: ${statusNamesVi[status]}`,
          message: `<p style="margin: 0;">${statusDetailMsg[status]}</p>`,
          actionUrl,
          actionText,
          type: status === 'Rejected' ? 'Reject' : 'Pass'
        });
        sendEmail(updatedApp.userId.email, `[Careerio] Thông báo hồ sơ: ${statusNamesVi[status]} - ${updatedApp.jobId?.title}`, emailHtml).catch(err => {
          console.error('[updateStatus email error]', err.message);
        });
      }
    } catch (notifErr) {
      console.error('[updateStatus notif error]', notifErr.message);
    }

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
    if (!app.userId?.email) return res.status(400).json({ message: 'Ứng viên không có địa chỉ email' });

    const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

    const emailHtml = generateCandidateEmailHtml({
      candidateName: app.userId?.fullName,
      jobTitle: app.jobId?.title,
      title: subject,
      message: content.replace(/\n/g, '<br/>'),
      actionUrl: `${frontendUrl}/candidate/applications`,
      actionText: 'Xem chi tiết ứng tuyển',
      type: type || (app.status === 'Rejected' ? 'Reject' : 'Pass')
    });

    let emailSent = false;
    let emailErrorMsg = '';
    try {
      await sendEmail(app.userId.email, subject, emailHtml);
      emailSent = true;
    } catch (err) {
      console.error(`[sendNotification] Gửi email thất bại cho ${app.userId.email}:`, err.message);
      emailErrorMsg = err.message;
    }

    app.mailSentStatus = type === 'Pass' ? 'Sent_Pass' : type === 'Reject' ? 'Sent_Reject' : (app.status === 'Rejected' ? 'Sent_Reject' : 'Sent_Pass');
    await app.save();

    try { 
      await createNotification({ 
        userId: app.userId._id, 
        title: subject, 
        message: content, 
        type: 'email_notification', 
        link: '/candidate/applications', 
        relatedApplicationId: app._id 
      }); 
      if (req.user?.id) {
        await createNotification({
          userId: req.user.id,
          title: `Đã gửi thư mời: ${app.userId?.fullName || 'Ứng viên'}`,
          message: `Bạn đã gửi thư/thông báo "${subject}" đến ứng viên ${app.userId?.fullName || ''} cho vị trí "${app.jobId?.title}".`,
          type: 'email_notification',
          link: `/bussiness/candidate/${app._id}`,
          relatedApplicationId: app._id
        });
      }
    } catch (err) {}

    if (!emailSent && emailErrorMsg) {
      return res.status(200).json({ 
        message: `Đã lưu thông báo nhưng gửi email thất bại: ${emailErrorMsg}. Vui lòng thử lại.`, 
        mailSentStatus: app.mailSentStatus,
        emailSent: false 
      });
    }

    return res.json({ message: 'Gửi thông báo và email thành công!', mailSentStatus: app.mailSentStatus, emailSent: true });
  } catch (error) { 
    console.error('[sendNotification error]:', error);
    res.status(500).json({ message: error.message || 'Lỗi gửi thông báo' }); 
  }
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
    const trendResult = await Application.aggregate([
      { $match: q },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    const recentApplications = await Application.find(q)
      .populate('userId', 'fullName email avatar cvUrl')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1, createdAt: -1 })
      .limit(15)
      .lean();

    return res.json({ 
      totalJobs, 
      totalApplications, 
      statusCounts: statsObj, 
      avgAiScore, 
      trend: trendResult,
      recentApplications 
    });
  } catch (error) { res.status(500).json({ message: 'Lỗi' }); }
};

exports.getMyTestHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await Application.find({ userId, testStatus: 'Completed' })
            .populate('jobId', 'title companyName recruitmentDeadline deadline status')
            .populate('assessmentId', 'assessmentName timeLimit questions')
            .sort({ testSubmittedAt: -1 })
            .lean();
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

    try {
      if (req.user?.id) {
        const scoreText = aiEvaluation.score !== undefined ? ` (Điểm mới: ${aiEvaluation.score}/100)` : '';
        const verdictText = aiEvaluation.verdict ? ` [${aiEvaluation.verdict}]` : '';
        await createNotification({
          userId: req.user.id,
          title: `AI đã chấm lại CV: ${populatedApp.userId?.fullName || 'Ứng viên'}${scoreText}`,
          message: `Hệ thống AI đã hoàn tất chấm lại hồ sơ cho vị trí "${job.title}". Điểm phù hợp mới: ${aiEvaluation.score || 0}/100${verdictText}.`,
          type: 'application_submitted',
          link: `/bussiness/candidate/${application._id}`,
          relatedApplicationId: application._id
        });
      }
    } catch (notifErr) {}

    return res.json({
      message: 'Đã phân tích và chấm lại hồ sơ theo Bands thành công!',
      data: populatedApp
    });
  } catch (error) {
    console.error('Lỗi reEvaluate:', error);
    return res.status(500).json({ message: 'Lỗi khi chấm lại hồ sơ: ' + error.message });
  }
};
