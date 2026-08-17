const aiService = require('../services/ai.service');
const InterviewTemplate = require('../models/InterviewTemplate');
const InterviewHistory = require('../models/InterviewHistory');
const User = require('../models/User'); 

exports.conductInterview = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        const plan = user.subscription?.plan || 'free';
        const limit = plan === 'pro' ? 180 : 15;
        const currentUsage = user.subscription?.usage?.mockInterviewMinutes || 0;

        if (currentUsage >= limit) {
            return res.status(403).json({ 
                message: "Bạn đã dùng hết số phút Phỏng vấn AI của tháng này. Vui lòng nâng cấp Pro!", 
                code: 'LIMIT_EXCEEDED' 
            });
        }

        const { history, jobPosition } = req.body;
        const lowerCaseJob = jobPosition.toLowerCase().trim();
        const userAnswersCount = (history || []).filter(msg => msg.role === 'user').length;

        // FIX LỖI DATABASE: Sử dụng Regex để tìm kiếm không phân biệt hoa/thường (Case-insensitive)
        let template = await InterviewTemplate.findOne({ 
            jobPosition: { $regex: new RegExp(`^${lowerCaseJob}$`, 'i') } 
        });

        // Chỉ gọi AI sinh câu hỏi mới nểu THỰC SỰ không tìm thấy
        if (!template) {
            const generatedQuestions = await aiService.generateQuestionsList(lowerCaseJob); 
            template = await InterviewTemplate.create({ jobPosition: lowerCaseJob, questions: generatedQuestions });
        }

        if (userAnswersCount >= template.questions.length) {
            return res.json({ fullText: "Bạn đã hoàn thành tất cả câu hỏi. Bấm Kết thúc để xem đánh giá.", remainingTime: 99999, isFinished: true });
        }

        const nextQuestion = template.questions[userAnswersCount];
        let audioData = null;
        if (aiService.textToSpeech) {
            audioData = await aiService.textToSpeech(nextQuestion);
        }

        if (!user.subscription.usage) user.subscription.usage = {};
        user.subscription.usage.mockInterviewMinutes = currentUsage + 1;
        await user.save();

        res.json({ fullText: nextQuestion, audioData: audioData, remainingTime: limit - (currentUsage + 1) });
    } catch (error) {
        console.error("Conduct Interview Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.evaluateInterview = async (req, res) => {
    try {
        const { history, jobPosition } = req.body;
        const userId = req.user.id || req.user._id || req.user.userId; 
        if (!userId) return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID người dùng" });

        const userMessages = (history || []).filter(msg => msg.role === 'user');
        let result;

        if (userMessages.length === 0) {
            result = {
                score: 0,
                overview: "Đánh giá không thể thực hiện vì ứng viên chưa đưa ra bất kỳ câu trả lời nào. Một cuộc phỏng vấn là một cuộc đối thoại, và hệ thống không có dữ liệu để đánh giá năng lực của bạn.",
                strengths: ["Chưa có dữ liệu để đánh giá điểm mạnh."],
                weaknesses: ["Ứng viên không cung cấp bất kỳ thông tin nào để trả lời cho câu hỏi phỏng vấn."],
                improvements: ["Hãy mạnh dạn trả lời các câu hỏi", "Đảm bảo micro/bàn phím của bạn hoạt động tốt"]
            };
        } else {
            result = await aiService.evaluateInterview(history, jobPosition);
            if (result.score === undefined || result.score === null) result.score = 0;
        }
        
        const newHistory = await InterviewHistory.create({
            user: userId, jobPosition: jobPosition, messages: history, reportData: result
        });

        res.json({ ...result, historyId: newHistory._id });
    } catch (err) { 
        console.error("Evaluate Interview Error:", err);
        res.status(500).json({ message: "Lỗi server khi đánh giá" }); 
    }
};

exports.getAvailableTemplates = async (req, res) => {
    try {
        const templates = await InterviewTemplate.find().select('jobPosition questions -_id');
        const positions = templates.map(t => ({ jobPosition: t.jobPosition, questionCount: t.questions.length }));
        res.json(positions);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.syncUsage = async (req, res) => {
    try { res.json({ success: true }); } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getInterviewHistory = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        if (!userId) return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID" });
        const histories = await InterviewHistory.find({ user: userId }).sort({ createdAt: -1 }).lean(); 
        const historyWithCounts = histories.map(history => {
            const questionCount = (history.messages || []).filter(msg => msg.role === 'model').length;
            return { ...history, questionCount };
        });
        res.json(historyWithCounts);
    } catch (error) { res.status(500).json({ message: "Lỗi khi lấy lịch sử phỏng vấn" }); }
};