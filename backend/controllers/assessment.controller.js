// File: backend/controllers/assessment.controller.js
const Assessment = require('../models/Assessment');
const Job = require('../models/Job');
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
        const { topic, quantity = 10, difficulty = 'Intermediate' } = req.body; 
        if (!topic) return res.status(400).json({ message: "Thiếu chủ đề (topic)" });

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
        
        // Đảm bảo ép đúng định dạng trước khi gửi xuống Client
        const questions = aiData.map(q => ({
            type: 'mcq',
            skill: topic,
            question: q.question,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswer: Number.isInteger(q.correctAnswer) ? q.correctAnswer : 0
        }));

        res.json({ questions });
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