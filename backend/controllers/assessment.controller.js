const Assessment = require('../models/Assessment');
const Job = require('../models/Job');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Application = require('../models/Application');
// Loại bỏ usageHelper ở đây vì ta sẽ xử lý manual cho an toàn
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateWithFallback(prompt) {
    const modelsToTry = ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"]; 
    let lastError;
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.7, responseMimeType: "application/json" } });
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
        const aiData = await generateWithFallback(prompt);
        
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

        if (status === 'PUBLISHED' && jobId) {
            await Job.findByIdAndUpdate(jobId, { testStatus: 'approved', status: 'active' });
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

        Object.keys(updates).forEach(key => test[key] = updates[key]);
        const savedTest = await test.save();

        if (updates.status === 'PUBLISHED' && test.jobId) {
            await Job.findByIdAndUpdate(test.jobId, { testStatus: 'approved', status: 'active' });
        }
        res.json(savedTest);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyTests = async (req, res) => {
    try {
        const tests = await Assessment.find({ createdBy: req.user.id }).populate('jobId', 'title').sort({ createdAt: -1 }).lean();
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
        const { answers, duration } = req.body; 
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
        application.testSubmittedAt = new Date();
        await application.save();

        res.json({ message: "Nộp bài thành công!", score: score, correctCount, totalQuestions });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getPublicTests = async (req, res) => {
    try {
        const tests = await Assessment.find({ isPublic: true, status: 'PUBLISHED' }).populate('createdBy', 'companyName fullName avatar').populate('jobId', 'companyName').sort({ createdAt: -1 }).lean();
        res.json(tests);
    } catch (error) { res.status(500).json({ message: error.message }); }
};