const aiService = require('../services/ai.service');
const InterviewTemplate = require('../models/InterviewTemplate');
const InterviewHistory = require('../models/InterviewHistory');
const User = require('../models/User'); 
const Job = require('../models/Job');
const CV = require('../models/CV');

exports.conductInterview = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

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
        const limit = isPro ? 180 : 15;
        const currentUsage = user.subscription?.usage?.mockInterviewMinutes || 0;

        if (currentUsage >= limit) {
            return res.status(403).json({ 
                message: `Bạn đã dùng hết số phút Phỏng vấn AI của tháng này (${currentUsage}/${limit} phút). Vui lòng nâng cấp gói Pro!`, 
                code: 'LIMIT_EXCEEDED' 
            });
        }

        const { history, jobPosition, jobId, customJd } = req.body;
        
        // 1. Trích xuất thông tin cá nhân hóa từ CV hoặc Profile của ứng viên
        let candidateContext = {
            fullName: user.fullName || "Ứng viên",
            skills: user.skills || [],
            experience: "",
            education: ""
        };

        try {
            const latestCv = await CV.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
            if (latestCv && latestCv.data) {
                candidateContext = {
                    fullName: latestCv.data.personal?.fullName || user.fullName || "Ứng viên",
                    skills: latestCv.data.skills || user.skills || [],
                    experience: (latestCv.data.experience || []).map(e => `${e.position || ''} tại ${e.company || ''} (${e.description || ''})`).filter(Boolean).join('; ') || '',
                    education: (latestCv.data.education || []).map(e => `${e.major || ''} tại ${e.school || ''}`).filter(Boolean).join('; ') || ''
                };
            }
        } catch (cvErr) {
            console.warn("Không lấy được CV của ứng viên:", cvErr.message);
        }

        // 2. Trích xuất thông tin bám sát JD từ Job thực tế trong hệ thống hoặc Job do ứng viên chọn
        let jobContext = {
            title: jobPosition || "Chuyên viên công nghệ",
            company: "Doanh nghiệp tuyển dụng",
            description: customJd || "",
            requirements: "",
            tags: []
        };

        if (jobId) {
            try {
                const jobDoc = await Job.findById(jobId).lean();
                if (jobDoc) {
                    jobContext = {
                        id: jobDoc._id,
                        title: jobDoc.title,
                        company: jobDoc.companyName || jobDoc.company || 'Doanh nghiệp tuyển dụng',
                        description: jobDoc.description || customJd || '',
                        requirements: jobDoc.requirements || '',
                        tags: jobDoc.tags || []
                    };
                }
            } catch (jobErr) {
                console.warn("Không lấy được Job theo ID:", jobErr.message);
            }
        } else if (jobPosition) {
            try {
                const jobDoc = await Job.findOne({ 
                    title: { $regex: new RegExp(`^${jobPosition.trim()}$`, 'i') }, 
                    status: 'active' 
                }).lean();
                if (jobDoc) {
                    jobContext = {
                        id: jobDoc._id,
                        title: jobDoc.title,
                        company: jobDoc.companyName || jobDoc.company || 'Doanh nghiệp tuyển dụng',
                        description: jobDoc.description || customJd || '',
                        requirements: jobDoc.requirements || '',
                        tags: jobDoc.tags || []
                    };
                }
            } catch (jobErr) {
                console.warn("Lỗi tìm kiếm Job theo tên:", jobErr.message);
            }
        }

        // 3. Gọi AI phỏng vấn tương tác 2 chiều (Hỏi - Đáp tự nhiên, bám sát JD, nhận xét + đặt câu hỏi + gợi ý)
        const aiResult = await aiService.conductMockInterview(history, jobContext, candidateContext);

        if (!user.subscription.usage) user.subscription.usage = {};
        user.subscription.usage.mockInterviewMinutes = currentUsage + 1;
        await user.save();

        res.json({ 
            feedback: aiResult.feedback,
            nextQuestion: aiResult.nextQuestion,
            hint: aiResult.hint,
            fullText: aiResult.fullText, 
            audioData: aiResult.audioData, 
            remainingTime: limit - (currentUsage + 1),
            isFinished: aiResult.isFinished,
            jobContext: {
                title: jobContext.title,
                company: jobContext.company
            }
        });
    } catch (error) {
        console.error("Conduct Interview Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.evaluateInterview = async (req, res) => {
    try {
        const { history, jobPosition, jobId, customJd } = req.body;
        const userId = req.user.id || req.user._id || req.user.userId; 
        if (!userId) return res.status(401).json({ message: "Lỗi xác thực: Không tìm thấy ID người dùng" });

        const user = await User.findById(userId);
        const userMessages = (history || []).filter(msg => msg.role === 'user');
        let result;

        if (userMessages.length === 0) {
            result = {
                score: 0,
                matchRating: "Không thể đánh giá độ phù hợp (Ứng viên chưa trả lời câu nào)",
                overview: "Đánh giá không thể thực hiện vì ứng viên chưa đưa ra bất kỳ câu trả lời nào. Một cuộc phỏng vấn là một cuộc đối thoại tương tác hai chiều, và hệ thống không có dữ liệu để đánh giá năng lực của bạn.",
                strengths: ["Chưa có dữ liệu để đánh giá điểm mạnh."],
                weaknesses: ["Ứng viên không cung cấp bất kỳ câu trả lời nào trong suốt buổi phỏng vấn."],
                improvements: ["Hãy mạnh dạn trả lời các câu hỏi", "Đảm bảo micro/bàn phím của bạn hoạt động tốt"]
            };
        } else {
            // Lấy thông tin ngữ cảnh Job và Ứng viên để đối chiếu JD
            let jobContext = {
                title: jobPosition || "Chuyên viên",
                company: "Doanh nghiệp",
                description: customJd || "",
                requirements: ""
            };

            if (jobId) {
                const jobDoc = await Job.findById(jobId).lean();
                if (jobDoc) {
                    jobContext = {
                        title: jobDoc.title,
                        company: jobDoc.companyName || jobDoc.company || 'Doanh nghiệp',
                        description: jobDoc.description || customJd || '',
                        requirements: jobDoc.requirements || ''
                    };
                }
            } else if (jobPosition) {
                const jobDoc = await Job.findOne({ 
                    title: { $regex: new RegExp(`^${jobPosition.trim()}$`, 'i') }, 
                    status: 'active' 
                }).lean();
                if (jobDoc) {
                    jobContext = {
                        title: jobDoc.title,
                        company: jobDoc.companyName || jobDoc.company || 'Doanh nghiệp',
                        description: jobDoc.description || customJd || '',
                        requirements: jobDoc.requirements || ''
                    };
                }
            }

            const candidateContext = {
                fullName: user?.fullName || 'Ứng viên',
                skills: user?.skills || []
            };

            result = await aiService.evaluateInterview(history, jobContext, candidateContext);
            if (result.score === undefined || result.score === null) result.score = 0;
        }
        
        const newHistory = await InterviewHistory.create({
            user: userId, 
            jobPosition: jobPosition || "Vị trí chuyên môn", 
            messages: history, 
            reportData: result
        });

        res.json({ ...result, historyId: newHistory._id });
    } catch (err) { 
        console.error("Evaluate Interview Error:", err);
        res.status(500).json({ message: "Lỗi server khi đánh giá" }); 
    }
};

exports.getAvailableTemplates = async (req, res) => {
    try {
        // Lấy danh sách việc làm thực tế đang tuyển trên Careerio để ứng viên phỏng vấn bám sát thực tế
        const activeJobs = await Job.find({ status: 'active' })
            .select('title companyName company requirements tags experience location')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const templates = activeJobs.map(job => ({
            _id: job._id,
            id: job._id,
            jobPosition: job.title,
            company: job.companyName || job.company || 'Doanh nghiệp',
            requirements: job.requirements || '',
            tags: job.tags || [],
            experience: job.experience || 'Không yêu cầu kinh nghiệm',
            location: job.location || '',
            isRealJob: true
        }));

        res.json(templates);
    } catch (error) { 
        console.error("Lỗi lấy template việc làm:", error);
        res.status(500).json({ message: error.message }); 
    }
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