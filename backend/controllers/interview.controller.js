const aiService = require('../services/ai.service');
const InterviewTemplate = require('../models/InterviewTemplate');
const InterviewHistory = require('../models/InterviewHistory');
const { checkCandidateLimit } = require('../utils/usageHelper');
exports.conductInterview = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        
        // --- KIỂM TRA & TRỪ THỜI GIAN (PHÚT) SỬ DỤNG ---
        try {
            await checkCandidateLimit(userId, 'interview');
        } catch (e) {
            if (e.message === 'LIMIT_EXCEEDED') {
                return res.status(403).json({ 
                    message: "Bạn đã dùng hết số phút Phỏng vấn AI của tháng này. Vui lòng nâng cấp Pro!", 
                    code: 'LIMIT_EXCEEDED' 
                });
            }
        }
        // ----------------------------------------------

        const { history, jobPosition } = req.body;
        const lowerCaseJob = jobPosition.toLowerCase().trim();
        const userAnswersCount = (history || []).filter(msg => msg.role === 'user').length;

        let template = await InterviewTemplate.findOne({ jobPosition: lowerCaseJob });

        if (!template) {
            const generatedQuestions = await aiService.generateQuestionsList(lowerCaseJob); 
            template = await InterviewTemplate.create({ jobPosition: lowerCaseJob, questions: generatedQuestions });
        }

        if (userAnswersCount >= template.questions.length) {
            return res.json({ 
                fullText: "Bạn đã hoàn thành tất cả câu hỏi cho vị trí này. Vui lòng bấm Kết thúc để xem đánh giá.",
                remainingTime: 99999, isFinished: true 
            });
        }

        const nextQuestion = template.questions[userAnswersCount];

        let audioData = null;
        if (aiService.textToSpeech) {
            audioData = await aiService.textToSpeech(nextQuestion);
        }

        res.json({ fullText: nextQuestion, audioData: audioData, remainingTime: 99999 });
    } catch (error) {
        console.error("Conduct Interview Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.evaluateInterview = async (req, res) => {
    try {
        const { history, jobPosition } = req.body;
        const userId = req.user.id || req.user._id || req.user.userId; 

        if (!userId) {
            return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID người dùng" });
        }

        const result = await aiService.evaluateInterview(history, jobPosition);
        
        const newHistory = await InterviewHistory.create({
            user: userId,
            jobPosition: jobPosition,
            messages: history,
            reportData: result
        });

        res.json({ ...result, historyId: newHistory._id });
    } catch (err) {
        console.error("Evaluate Interview Error:", err);
        res.status(500).json({ message: "Lỗi server khi đánh giá" });
    }
};

// SỬA HÀM NÀY: Lấy kèm theo độ dài mảng câu hỏi
exports.getAvailableTemplates = async (req, res) => {
    try {
        const templates = await InterviewTemplate.find().select('jobPosition questions -_id');
        // Trả về mảng object chứa tên vị trí và tổng số câu hỏi
        const positions = templates.map(t => ({
            jobPosition: t.jobPosition,
            questionCount: t.questions.length
        }));
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.syncUsage = async (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ message: "Lỗi đồng bộ: " + error.message }); 
    }
};

exports.getInterviewHistory = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        
        if (!userId) {
            return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID người dùng" });
        }

        const InterviewHistory = require('../models/InterviewHistory');
        const histories = await InterviewHistory.find({ user: userId }).sort({ createdAt: -1 }).lean(); 
        
        const historyWithCounts = histories.map(history => {
            const questionCount = (history.messages || []).filter(msg => msg.role === 'model').length;
            return { ...history, questionCount };
        });

        res.json(historyWithCounts);
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ message: "Lỗi khi lấy lịch sử phỏng vấn" });
    }
};