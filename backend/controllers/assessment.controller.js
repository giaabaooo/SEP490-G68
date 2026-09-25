const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Job = require('../models/Job');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Application = require('../models/Application');
const { createNotification } = require('../utils/notificationHelper');
const aiService = require('../services/ai.service');

const resolveJobStatusAfterAssessment = (job, isPublished) => {
    const deadline = job?.recruitmentDeadline ? new Date(job.recruitmentDeadline) : null;
    if (job?.status === 'closed' || (deadline && !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now())) {
        return 'closed';
    }
    if (job?.status === 'active') return 'active';
    if (!isPublished && job?.status === 'ready' && job?.testStatus === 'approved') return 'ready';
    return isPublished ? 'ready' : 'pending';
};

exports.generateAI = async (req, res) => {
    try {
        const { topic, quantity = 10, difficulty = 'Intermediate', jobId } = req.body; 
        
        if (!topic) return res.status(400).json({ message: "Thiếu chủ đề (topic)" });

        let currentJob = null;
        let currentUser = null;

        if (jobId) {
            currentJob = await Job.findById(jobId);
            if (!currentJob) return res.status(404).json({ message: "Không tìm thấy Job." });
        }

        // Cố định số lượng câu hỏi theo cấu hình của Job nếu có jobId
        const finalQuantity = currentJob ? (currentJob.testQuestionsCount || 10) : (Number(quantity) || 10);
        const tokenCost = finalQuantity * 5;

        // 1. KIỂM TRA HẠN MỨC TOKEN
        if (currentJob) {
            if ((currentJob.aiTokensQuota || 0) < tokenCost) {
                return res.status(402).json({ 
                    message: `Hạn mức Token nội bộ của Job này không đủ (Cần ${tokenCost} Token, hiện có ${currentJob.aiTokensQuota || 0} Token). Vui lòng liên hệ Business nạp thêm.` 
                });
            }
        } else {
            // Trường hợp tạo Practice Topic (không gắn với Job)
            currentUser = await User.findById(req.user.id);
            if (!currentUser) return res.status(404).json({ message: "Không tìm thấy người dùng." });
            
            if (currentUser.role !== 'admin' && (currentUser.businessCredits?.balance || 0) < tokenCost) {
                return res.status(402).json({ message: `Số dư Token trong ví không đủ (${tokenCost} Token). Vui lòng nạp thêm!` });
            }
        }

        const prompt = `Vai trò: Chuyên gia tuyển dụng IT. Chủ đề: "${topic}". Trình độ: ${difficulty}. Ngôn ngữ: Tiếng Việt. Số lượng: ${finalQuantity} câu hỏi. Nhiệm vụ: Tạo bộ câu hỏi trắc nghiệm (MCQ) có 4 đáp án, 1 đáp án đúng. Trả về mảng JSON. Cấu trúc bắt buộc: [{"question": "Nội dung...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;

        // 2. GỌI AI XỬ LÝ
        const aiData = await aiService.generateWithFallback(prompt, true, 0.4);
        
        const questions = aiData.map(q => ({
            type: 'mcq', skill: topic, question: q.question,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0,
            isChecked: false
        }));

        // 3. NẾU AI THÀNH CÔNG -> MỚI TRỪ TOKEN (Admin hoàn toàn miễn phí, không trừ token)
        if (currentJob) {
            currentJob.aiTokensQuota = Math.max(0, (currentJob.aiTokensQuota || 0) - tokenCost);
            await currentJob.save();
        } else if (currentUser && currentUser.role !== 'admin' && currentUser.businessCredits) {
            currentUser.businessCredits.balance = Math.max(0, (currentUser.businessCredits.balance || 0) - tokenCost);
            await currentUser.save();
        }

        res.json({ 
            questions, 
            message: currentUser?.role === 'admin' ? "Tạo câu hỏi thành công (Đặc quyền Admin)" : `Tạo câu hỏi thành công (-${tokenCost} Token)`,
            remainingJobQuota: currentJob ? currentJob.aiTokensQuota : undefined,
            remainingTokens: currentUser?.role === 'admin' ? 999999 : currentUser?.businessCredits?.balance
        });
    } catch (error) {
        console.error("AI Generate Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createAssessment = async (req, res) => {
    try {
        const { assessmentName, timeLimit, questions, status, isPublic, description, startDate, endDate, tags, jobId } = req.body;
        const newTest = new Assessment({ 
            createdBy: req.user.id, 
            jobId, 
            assessmentName, 
            timeLimit, 
            questions, 
            description, 
            status: status || 'DRAFT', 
            isPublic: isPublic || false, 
            startDate, 
            endDate, 
            tags 
        });
        const savedTest = await newTest.save();

        if (jobId) {
            const isPublished = status === 'PUBLISHED';
            const linkedJob = await Job.findById(jobId);
            const nextJobStatus = resolveJobStatusAfterAssessment(linkedJob, isPublished);
            const updatedJob = await Job.findByIdAndUpdate(
                jobId,
                {
                    $set: {
                        assessmentId: savedTest._id,
                        testStatus: isPublished ? 'approved' : 'pending',
                        status: nextJobStatus
                    }
                },
                { new: true }
            );

            // Đồng bộ ngay assessmentId cho các hồ sơ ứng tuyển của Job này chưa hoàn thành bài test
            await Application.updateMany(
                { jobId, testStatus: { $ne: 'Completed' } },
                { $set: { assessmentId: savedTest._id, hasTest: isPublished } }
            );

            if (updatedJob && updatedJob.recruiterId) {
                if (isPublished) {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đã được duyệt - Sẵn sàng đăng tuyển',
                        message: `Moderator đã xuất bản bài test cho vị trí "${updatedJob.title}". Vui lòng kiểm tra nội dung và mở tin tuyển dụng.`,
                        type: 'job_approved',
                        link: `/bussiness/edit-job/${updatedJob._id}`
                    });
                } else {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đang được soạn thảo (Bản nháp)',
                        message: `Chuyên gia đã tạo bản nháp bài test cho vị trí "${updatedJob.title}". Công việc sẽ tự động kích hoạt khi bài test được xuất bản.`,
                        type: 'test_draft',
                        link: `/bussiness/post-job`
                    });
                }
            }
        }
        res.json(savedTest);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        let test = await Assessment.findById(id);
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        // Tìm thông tin người dùng đang thực hiện
        const currentUser = await User.findById(req.user.id);
        const userEmail = (currentUser?.email || req.user.email || '').toLowerCase().trim();
        const userRole = currentUser?.role || req.user.role;
        const userSubRole = currentUser?.subRole || req.user.subRole;

        // Kiểm tra quyền chỉnh sửa bài test
        const isOwner = test.createdBy && String(test.createdBy) === String(req.user.id);
        const isAdmin = userRole === 'admin';
        const isModeratorRole = userRole === 'moderator' || userSubRole === 'moderator';
        let isAssignedMod = false;

        const targetJobId = test.jobId || updates.jobId;
        if (targetJobId) {
            const linkedJob = await Job.findById(targetJobId);
            if (linkedJob) {
                if (String(linkedJob.recruiterId) === String(req.user.id) || 
                    (linkedJob.moderatorEmail && linkedJob.moderatorEmail.toLowerCase().trim() === userEmail)) {
                    isAssignedMod = true;
                }
            }
        }

        if (!isOwner && !isAdmin && !isModeratorRole && !isAssignedMod) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa bài test này" });
        }

        const prevStatus = test.status;

        // Cập nhật các trường dữ liệu và đánh dấu modified
        if (updates.assessmentName) test.assessmentName = updates.assessmentName;
        if (updates.description !== undefined) test.description = updates.description;
        if (updates.timeLimit) test.timeLimit = updates.timeLimit;
        if (updates.status) test.status = updates.status;
        if (updates.tags) test.tags = updates.tags;
        if (updates.isPublic !== undefined) test.isPublic = updates.isPublic;
        if (targetJobId && !test.jobId) test.jobId = targetJobId;
        if (!test.createdBy) test.createdBy = req.user.id;

        if (updates.questions && Array.isArray(updates.questions)) {
            test.questions = updates.questions.map(q => ({
                type: q.type || 'mcq',
                skill: q.skill || 'General',
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
                mediaUrl: q.mediaUrl,
                mediaType: q.mediaType || 'none',
                isChecked: q.isChecked !== undefined ? !!q.isChecked : false
            }));
            test.markModified('questions');
        }

        const savedTest = await test.save();

        if (targetJobId) {
            const isPublished = updates.status ? updates.status === 'PUBLISHED' : test.status === 'PUBLISHED';
            const linkedJob = await Job.findById(targetJobId);
            const nextJobStatus = resolveJobStatusAfterAssessment(linkedJob, isPublished);
            const jobUpdate = {
                assessmentId: savedTest._id,
                testStatus: isPublished ? 'approved' : 'pending',
                status: nextJobStatus
            };
            const updatedJob = await Job.findByIdAndUpdate(targetJobId, { $set: jobUpdate }, { new: true });

            // Đồng bộ ngay assessmentId cho các hồ sơ ứng tuyển của Job này chưa hoàn thành bài test
            await Application.updateMany(
                { jobId: targetJobId, testStatus: { $ne: 'Completed' } },
                { $set: { assessmentId: savedTest._id, hasTest: isPublished } }
            );

            if (updatedJob && updatedJob.recruiterId) {
                if (isPublished && prevStatus !== 'PUBLISHED') {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đã được duyệt - Sẵn sàng đăng tuyển',
                        message: `Moderator đã xuất bản bài test cho vị trí "${updatedJob.title}". Vui lòng kiểm tra nội dung và mở tin tuyển dụng.`,
                        type: 'job_approved',
                        link: `/bussiness/edit-job/${updatedJob._id}`
                    });
                } else if (!isPublished) {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test được lưu bản nháp',
                        message: `Bài test cho vị trí "${updatedJob.title}" đang ở trạng thái bản nháp. Công việc tạm thời ở trạng thái chờ duyệt.`,
                        type: 'test_draft',
                        link: `/bussiness/post-job`
                    });
                } else {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đã được cập nhật',
                        message: `Chuyên gia vừa cập nhật lại nội dung bộ đề cho vị trí "${updatedJob.title}".`,
                        type: 'test_updated',
                        link: `/bussiness/post-job`
                    });
                }
            }
        }
        res.json(savedTest);
    } catch (err) { 
        console.error("Lỗi updateAssessment:", err);
        res.status(500).json({ message: err.message }); 
    }
};

exports.getMyTests = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const tests = await Assessment.find({})
                .populate('jobId', 'title recruitmentDeadline deadline status location salary type tags')
                .sort({ createdAt: -1 })
                .lean();
            return res.json(tests);
        }

        const user = await User.findById(req.user.id);
        const orConditions = [{ createdBy: req.user.id }];
        if (user?.email) {
            const assignedJobs = await Job.find({ moderatorEmail: user.email.toLowerCase().trim() }).select('_id');
            const jobIds = assignedJobs.map(j => j._id);
            if (jobIds.length > 0) {
                orConditions.push({ jobId: { $in: jobIds } });
            }
        }

        const tests = await Assessment.find({ $or: orConditions })
            .populate('jobId', 'title recruitmentDeadline deadline status location salary type tags')
            .sort({ createdAt: -1 })
            .lean();
        res.json(tests);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getTestsByJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ message: "ID công việc không hợp lệ" });
        }

        const [job, currentUser] = await Promise.all([
            Job.findById(jobId).lean(),
            User.findById(req.user.id).select('email role subRole').lean()
        ]);
        if (!job) return res.status(404).json({ message: "Không tìm thấy công việc" });

        const normalizedEmail = (currentUser?.email || '').toLowerCase().trim();
        const canView = req.user.role === 'admin'
            || String(job.recruiterId) === String(req.user.id)
            || (job.moderatorEmail && job.moderatorEmail === normalizedEmail);
        if (!canView) return res.status(403).json({ message: "Bạn không có quyền xem bài test của công việc này" });

        const tests = await Assessment.find({ jobId })
            .populate('createdBy', 'fullName email')
            .sort({ updatedAt: -1 })
            .lean();
        return res.json(tests);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === '[object Object]' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID bài test không hợp lệ" });
        }
        const test = await Assessment.findById(id);
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });
        res.json(test);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getTestForCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === '[object Object]' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID bài test không hợp lệ" });
        }
        let test = await Assessment.findById(id).populate('jobId', 'title companyName companyLogo assessmentId');
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        // Tự động lấy bài test mới nhất của Job nếu bài test này đã được cập nhật/thay thế
        if (test.jobId && test.jobId.assessmentId && String(test.jobId.assessmentId) !== String(test._id)) {
            const latestTest = await Assessment.findById(test.jobId.assessmentId).populate('jobId', 'title companyName companyLogo assessmentId');
            if (latestTest) {
                test = latestTest;
            }
        }

        // Tự động ghi nhận thời gian bắt đầu làm bài và kiểm tra trạng thái
        if (req.user?.id && test.jobId) {
            try {
                const jobId = test.jobId?._id || test.jobId;
                const application = await Application.findOne({ userId: req.user.id, jobId }).sort({ createdAt: -1 });
                
                // NẾU ĐÃ HOÀN THÀNH BÀI THI -> CHẶN KHÔNG CHO VÀO LÀM LẠI
                if (application && application.testStatus === 'Completed') {
                    return res.status(400).json({ 
                        message: "Bạn đã hoàn thành bài Test này rồi. Không thể làm lại!", 
                        isCompleted: true,
                        jobId: jobId,
                        applicationId: application._id
                    });
                }

                if (application && application.testStatus === 'Not_Started') {
                    application.testStatus = 'In_Progress';
                    if (!application.testStartedAt) application.testStartedAt = new Date();
                    if (application.status === 'Applied') application.status = 'Testing';
                    await application.save();
                }
            } catch (appErr) {
                console.warn("Lỗi cập nhật testStatus In_Progress:", appErr.message);
            }
        }

        const safeTest = test.toObject();
        safeTest.questions = safeTest.questions.map(q => { delete q.correctAnswer; return q; });
        res.json(safeTest);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.submitTest = async (req, res) => {
    try {
        const { id } = req.params; 
        const { answers, duration, tabSwitches } = req.body; 
        const userId = req.user.id;

        let test = await Assessment.findById(id).populate('jobId', 'title assessmentId');
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        // Tự động dùng bài test mới nhất của Job nếu bài test này đã được cập nhật
        if (test.jobId && test.jobId.assessmentId && String(test.jobId.assessmentId) !== String(test._id)) {
            const latestTest = await Assessment.findById(test.jobId.assessmentId).populate('jobId', 'title assessmentId');
            if (latestTest) {
                test = latestTest;
            }
        }

        let correctCount = 0;
        const totalQuestions = test.questions.length;
        test.questions.forEach((q, index) => {
            const userAnswer = answers[index.toString()];
            if (userAnswer !== undefined && userAnswer === q.correctAnswer) correctCount++;
        });

        const score = Math.round((correctCount / totalQuestions) * 100);
        const application = await Application.findOne({ userId, jobId: test.jobId }).sort({ createdAt: -1 });
        
        if (!application) return res.status(400).json({ message: "Bạn chưa nộp CV ứng tuyển vị trí này, không thể lưu điểm!" });
        if (application.testStatus === 'Completed') return res.status(400).json({ message: "Bạn đã hoàn thành bài Test. Vui lòng nộp lại CV để có thêm lượt làm bài." });

        application.testStatus = 'Completed';
        application.testScore = score;
        application.testAnswers = answers;
        application.testDuration = duration || 0;
        application.tabSwitches = typeof tabSwitches === 'number' ? tabSwitches : (Number(tabSwitches) || 0);
        application.testSubmittedAt = new Date();
        if (application.status === 'Applied') {
            application.status = 'Testing';
        }
        await application.save();

        const populatedApp = await Application.findById(application._id)
            .populate('jobId', 'title companyName recruitmentDeadline deadline status recruiterId')
            .populate('assessmentId');

        // Gửi thông báo cho ứng viên
        await createNotification({
            userId,
            title: 'Hoàn thành bài kiểm tra năng lực',
            message: `Bạn đã hoàn thành bài test cho vị trí "${populatedApp?.jobId?.title || 'công việc'}" với điểm số ${score}/100.`,
            type: 'test_completed',
            link: '/candidate/test-history',
            relatedApplicationId: application._id
        });

        // Gửi thông báo cho nhà tuyển dụng
        const candidateUser = await User.findById(userId).select('fullName');
        if (populatedApp?.jobId?.recruiterId) {
            await createNotification({
                userId: populatedApp.jobId.recruiterId,
                title: `Ứng viên nộp bài test: ${candidateUser?.fullName || 'Ứng viên'} (${score}/100đ)`,
                message: `Ứng viên ${candidateUser?.fullName || 'Một ứng viên'} vừa nộp bài test cho vị trí "${populatedApp.jobId.title}" với kết quả: ${score}/100 (${correctCount}/${totalQuestions} câu đúng). Bấm để xem chi tiết bài làm.`,
                type: 'test_completed',
                link: `/bussiness/candidate/${application._id}`,
                relatedApplicationId: application._id
            });
        }

        // Gửi thông báo cho Moderator (người biên soạn đề)
        if (test.createdBy) {
            await createNotification({
                userId: test.createdBy,
                title: 'Ứng viên vừa hoàn thành bài test của bạn',
                message: `Ứng viên ${candidateUser?.fullName || 'Một ứng viên'} vừa nộp bài test cho vị trí "${populatedApp?.jobId?.title || 'vị trí'}" với kết quả: ${score}/100.`,
                type: 'test_submitted',
                link: '/moderator/test-bank',
                relatedApplicationId: application._id
            });
        }

        res.json({ 
            message: "Nộp bài thành công!", 
            score: score, 
            correctCount, 
            totalQuestions, 
            application: populatedApp || application 
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getPublicTests = async (req, res) => {
    try {
        const tests = await Assessment.find({ isPublic: true, status: 'PUBLISHED' }).populate('createdBy', 'companyName fullName avatar').populate('jobId', 'companyName').sort({ createdAt: -1 }).lean();
        res.json(tests);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
