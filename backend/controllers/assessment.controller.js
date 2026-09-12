const Assessment = require('../models/Assessment');
const Job = require('../models/Job');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Application = require('../models/Application');
const { createNotification } = require('../utils/notificationHelper');
const aiService = require('../services/ai.service');

exports.generateAI = async (req, res) => {
    try {
        const { topic, quantity = 10, difficulty = 'Intermediate', jobId } = req.body; 
        
        if (!topic) return res.status(400).json({ message: "Thiếu chủ đề (topic)" });
        if (!jobId) return res.status(400).json({ message: "Thiếu thông tin jobId để tính phí." });

        // 1. CHỈ CHECK HẠN MỨC (KHÔNG TRỪ NGAY)
        const currentJob = await Job.findById(jobId);
        if (!currentJob) return res.status(404).json({ message: "Không tìm thấy Job." });
        
        if ((currentJob.aiTokensQuota || 0) < 50) {
            return res.status(402).json({ message: "Hạn mức Token nội bộ của Job này đã hết. Vui lòng liên hệ Business nạp thêm." });
        }

        const prompt = `Vai trò: Chuyên gia tuyển dụng IT. Chủ đề: "${topic}". Trình độ: ${difficulty}. Ngôn ngữ: Tiếng Việt. Số lượng: ${quantity} câu hỏi. Nhiệm vụ: Tạo bộ câu hỏi trắc nghiệm (MCQ) có 4 đáp án, 1 đáp án đúng. Trả về mảng JSON. Cấu trúc bắt buộc: [{"question": "Nội dung...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;

        // 2. GỌI AI XỬ LÝ
        const aiData = await aiService.generateWithFallback(prompt, true, 0.4);
        
        const questions = aiData.map(q => ({
            type: 'mcq', skill: topic, question: q.question,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0
        }));

        // 3. NẾU AI THÀNH CÔNG -> MỚI TRỪ TOKEN
        currentJob.aiTokensQuota -= 50;
        await currentJob.save();

        res.json({ 
            questions, 
            message: "Tạo câu hỏi thành công (-50 Token)",
            remainingJobQuota: currentJob.aiTokensQuota 
        });
    } catch (error) {
        console.error("AI Generate Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createAssessment = async (req, res) => {
    try {
        const { assessmentName, timeLimit, questions, status, isPublic, description, startDate, endDate, tags, jobId } = req.body;
        const newTest = new Assessment({ createdBy: req.user.id, jobId, assessmentName, timeLimit, questions, description, status: status || 'DRAFT', isPublic: isPublic || false, startDate, endDate, tags });
        const savedTest = await newTest.save();

        if (jobId) {
            const isPublished = status === 'PUBLISHED';
            const updatedJob = await Job.findByIdAndUpdate(
                jobId, 
                { 
                    assessmentId: savedTest._id,
                    ...(isPublished ? { testStatus: 'approved', status: 'active' } : { testStatus: 'pending' })
                }, 
                { new: true }
            );

            if (updatedJob && updatedJob.recruiterId) {
                if (isPublished) {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đã duyệt - Tin tuyển dụng đã kích hoạt!',
                        message: `Chuyên gia đã hoàn tất và xuất bản bài test cho vị trí "${updatedJob.title}". Tin tuyển dụng của bạn hiện đã hoạt động.`,
                        type: 'job_approved',
                        link: `/bussiness/post-job`
                    });
                } else {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đang được soạn thảo (Bản nháp)',
                        message: `Chuyên gia đã tạo bản nháp bài test cho vị trí "${updatedJob.title}". Tin tuyển dụng sẽ tự động kích hoạt khi bài test được xuất bản.`,
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
        const test = await Assessment.findOne({ _id: id, createdBy: req.user.id });
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        const prevStatus = test.status;
        Object.keys(updates).forEach(key => test[key] = updates[key]);
        const savedTest = await test.save();

        const targetJobId = test.jobId || updates.jobId;
        if (targetJobId) {
            const isPublished = updates.status === 'PUBLISHED' || test.status === 'PUBLISHED';
            const updatedJob = await Job.findByIdAndUpdate(
                targetJobId, 
                { 
                    assessmentId: savedTest._id,
                    ...(isPublished ? { testStatus: 'approved', status: 'active' } : {})
                }, 
                { new: true }
            );

            if (updatedJob && updatedJob.recruiterId) {
                if (updates.status === 'PUBLISHED' && prevStatus !== 'PUBLISHED') {
                    await createNotification({
                        userId: updatedJob.recruiterId,
                        title: 'Bài test đã duyệt - Tin tuyển dụng đã kích hoạt!',
                        message: `Chuyên gia đã phê duyệt bài test cho vị trí "${updatedJob.title}". Tin tuyển dụng của bạn hiện đã hoạt động.`,
                        type: 'job_approved',
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
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyTests = async (req, res) => {
    try {
        const tests = await Assessment.find({ createdBy: req.user.id })
            .populate('jobId', 'title recruitmentDeadline deadline status location salary type tags')
            .sort({ createdAt: -1 })
            .lean();
        res.json(tests);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getTestById = async (req, res) => {
    try {
        const test = await Assessment.findById(req.params.id);
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });
        res.json(test);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getTestForCandidate = async (req, res) => {
    try {
        const test = await Assessment.findById(req.params.id).populate('jobId', 'title companyName companyLogo');
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });
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

        const test = await Assessment.findById(id);
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

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
        await application.save();

        const populatedApp = await Application.findById(application._id)
            .populate('jobId', 'title companyName recruitmentDeadline recruiterId')
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