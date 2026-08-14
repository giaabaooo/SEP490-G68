// File: backend/controllers/assessment.controller.js
const Assessment = require('../models/Assessment');
const Job = require('../models/Job');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Application = require('../models/Application');
const usageHelper = require('../utils/usageHelper');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cơ chế Smart Fallback tránh sập hệ thống khi Model bị đổi tên
async function generateWithFallback(prompt) {
    const modelsToTry = [
        "gemini-2.5-pro", 
        "gemini-1.5-pro", 
        "gemini-1.5-flash", 
        "gemini-pro"
    ]; 
    let lastError;
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            let text = await result.response.text();
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);
        } catch (error) {
            console.warn(`⚠️ Model ${modelName} thất bại:`, error.message);
            lastError = error;
        }
    }
    throw new Error("API AI hiện không khả dụng, vui lòng thử lại sau.");
}

// TẠO CÂU HỎI BẰNG AI (CHỈ MCQ)
exports.generateAI = async (req, res) => {
    try {
        // Nhận thêm jobId từ Frontend gửi lên
        const { topic, quantity = 10, difficulty = 'Intermediate', jobId } = req.body; 
        
        if (!topic) return res.status(400).json({ message: "Thiếu chủ đề (topic)" });
        if (!jobId) return res.status(400).json({ message: "Thiếu thông tin jobId để tính phí." });

        // KIỂM TRA VÀ TRỪ HẠN MỨC NỘI BỘ CỦA JOB (Phí: 50 Token / 1 lần Generate)
        try {
            await usageHelper.checkJobQuotaToken(jobId, 50);
        } catch (tokenError) {
            if (tokenError.message === 'INSUFFICIENT_JOB_QUOTA') {
                return res.status(402).json({ message: "Hạn mức Token nội bộ của Job này đã hết. Vui lòng liên hệ Business nạp thêm." });
            }
            throw tokenError;
        }

        const prompt = `
        Vai trò: Chuyên gia tuyển dụng IT.
        Chủ đề: "${topic}". Trình độ: ${difficulty}. Ngôn ngữ: Tiếng Việt.
        Số lượng: ${quantity} câu hỏi.
        
        Nhiệm vụ: Tạo bộ câu hỏi trắc nghiệm (MCQ) có 4 đáp án, 1 đáp án đúng. Trả về mảng JSON.
        
        Cấu trúc bắt buộc:
        [
            {
                "question": "Nội dung câu hỏi...",
                "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                "correctAnswer": 0 // Số nguyên từ 0 đến 3
            }
        ]
        `;

        const aiData = await generateWithFallback(prompt);
        
        const questions = aiData.map(q => ({
            type: 'mcq',
            skill: topic,
            question: q.question,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0
        }));

        // Lấy số dư hiện tại trả về để Frontend update UI
        const currentJob = await Job.findById(jobId).select('aiTokensQuota');

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

// LƯU BÀI TEST & CẬP NHẬT JOB
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

        // NẾU DUYỆT BÀI (PUBLISHED) THÌ CẬP NHẬT TRẠNG THÁI JOB LÊN ACTIVE
        if (status === 'PUBLISHED' && jobId) {
            await Job.findByIdAndUpdate(jobId, { 
                testStatus: 'approved',
                status: 'active' 
            });
        }

        res.json(savedTest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CẬP NHẬT BÀI TEST TỒN TẠI (EDIT TEST)
exports.updateAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const test = await Assessment.findOne({ _id: id, createdBy: req.user.id });
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        Object.keys(updates).forEach(key => test[key] = updates[key]);
        const savedTest = await test.save();

        // Gắn lại Job lên Active nếu vừa được duyệt xong
        if (updates.status === 'PUBLISHED' && test.jobId) {
            await Job.findByIdAndUpdate(test.jobId, { 
                testStatus: 'approved',
                status: 'active' 
            });
        }

        res.json(savedTest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET DANH SÁCH BÀI TEST CỦA MODERATOR
exports.getMyTests = async (req, res) => {
    try {
        const tests = await Assessment.find({ createdBy: req.user.id })
            .populate('jobId', 'title') // Lấy tên job tương ứng
            .sort({ createdAt: -1 })
            .lean();
            
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET CHI TIẾT BÀI TEST BẰNG ID
exports.getTestById = async (req, res) => {
    try {
        const test = await Assessment.findById(req.params.id);
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTestForCandidate = async (req, res) => {
    try {
        const test = await Assessment.findById(req.params.id).populate('jobId', 'title companyName companyLogo');
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        const safeTest = test.toObject();
        safeTest.questions = safeTest.questions.map(q => {
            delete q.correctAnswer;
            return q;
        });

        res.json(safeTest);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// NỘP BÀI THI & CHẤM ĐIỂM TỰ ĐỘNG (CHỈ MCQ)
exports.submitTest = async (req, res) => {
    try {
        const { id } = req.params; 
        const { answers, duration } = req.body; 
        const userId = req.user.id;

        const test = await Assessment.findById(id);
        if (!test) return res.status(404).json({ message: "Không tìm thấy bài test" });

        let correctCount = 0;
        const totalQuestions = test.questions.length;

        test.questions.forEach((q, index) => {
            const userAnswer = answers[index.toString()];
            if (userAnswer !== undefined && userAnswer === q.correctAnswer) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / totalQuestions) * 100);

        // ✅ FIX TẠI ĐÂY: Tìm Application MỚI NHẤT của ứng viên cho Job này
        const application = await Application.findOne({ userId, jobId: test.jobId }).sort({ createdAt: -1 });
        
        if (!application) {
            return res.status(400).json({ message: "Bạn chưa nộp CV ứng tuyển vị trí này, không thể lưu điểm!" });
        }
        
        if (application.testStatus === 'Completed') {
            return res.status(400).json({ message: "Lần ứng tuyển này bạn đã hoàn thành bài Test. Vui lòng nộp lại CV để có thêm lượt làm bài (Tối đa 3 lần)." });
        }

        // Cập nhật kết quả vào Application mới nhất
        application.testStatus = 'Completed';
        application.testScore = score;
        application.testAnswers = answers;
        application.testDuration = duration || 0;
        application.testSubmittedAt = new Date();
        await application.save();

        res.json({ message: "Nộp bài thành công!", score: score, correctCount, totalQuestions });
    } catch (error) {
        console.error("Lỗi nộp bài thi:", error);
        res.status(500).json({ message: error.message });
    }
};
exports.getPublicTests = async (req, res) => {
    try {
        const tests = await Assessment.find({ isPublic: true, status: 'PUBLISHED' })
            .populate('createdBy', 'companyName fullName avatar')
            .populate('jobId', 'companyName') // Phòng trường hợp Test này gắn với Job nhưng vẫn được Public
            .sort({ createdAt: -1 })
            .lean();
            
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};