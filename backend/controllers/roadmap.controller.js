// File: backend/controllers/roadmap.controller.js
const Roadmap = require('../models/Roadmap');
const aiService = require('../services/ai.service'); // Trỏ đúng tới file chứa hàm generateWithFallback của bạn

exports.getRoadmap = async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ sourceId: req.params.sourceId });
        return res.json(roadmap || null);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.generateRoadmap = async (req, res) => {
    try {
        const { sourceId, testType, timeframe, goal, testResult } = req.body;
        const { topic, score, totalQuestions, weakSkills, jd } = testResult;

        let contextPart = `
        - Điểm số hiện tại: ${score}/${totalQuestions}.
        - Các kỹ năng còn yếu cần tập trung: ${weakSkills.join(', ')}.
        `;
        
        // Nếu là Test Job có JD thì AI sẽ bám sát JD hơn
        if (jd && testType === 'JOB') {
            contextPart += `\n- Mô tả công việc (JD) ứng tuyển: ${jd}`;
        }

        const prompt = `
        Bạn là một Chuyên gia Đào tạo & Phát triển Nghề nghiệp (L&D Specialist) đa lĩnh vực.
        Dựa trên kết quả bài test thuộc lĩnh vực: "${topic}"
        ${contextPart}

        NHIỆM VỤ:
        1. Thiết kế lộ trình học tập trong khoảng thời gian: "${timeframe}" với mục tiêu chính là: "${goal}". 
        Nội dung phải thực tế, chuyên sâu, khắc phục các kỹ năng còn yếu ở trên.
        2. Đề xuất 3-5 khóa học MIỄN PHÍ (Free/Audit/Open Courseware) chất lượng cao.

        YÊU CẦU VỀ KHÓA HỌC (QUAN TRỌNG - ANTI HALLUCINATION):
        - ĐA DẠNG NGUỒN THEO NGÀNH: 
          + IT/Tech: Coursera, edX, freeCodeCamp, Udemy (Free), F8.
          + Marketing/Business: HubSpot Academy, Google Skillshop, LinkedIn Learning.
          + Kế toán/Tài chính: CFI (Free courses), ACCA Global, Khan Academy.
          + Kỹ thuật/Xây dựng: MIT OpenCourseWare, Stanford Engineering Everywhere.
        - TÍNH XÁC THỰC: Chỉ đề xuất các khóa học KINH ĐIỂN, NỔI TIẾNG và ĐANG TỒN TẠI. Tuyệt đối không tự bịa tên khóa học.
        - LINK: Ưu tiên link chính xác. Nếu không chắc chắn, hãy đưa link trang chủ nền tảng.

        OUTPUT JSON CHUẨN (Không Markdown, không bọc \`\`\`json):
        {
            "overview": "Đánh giá ngắn gọn về mục tiêu cần đạt sau ${timeframe}",
            "weeks": [
                { 
                    "week": "Tên giai đoạn (VD: Tuần 1, Tháng 1)", 
                    "focus": "Tiêu đề trọng tâm", 
                    "tasks": ["Nhiệm vụ 1", "Nhiệm vụ 2"] 
                }
            ],
            "suggestedCourses": [
                {
                    "platform": "Tên nền tảng (VD: HubSpot Academy)",
                    "title": "Tên khóa học",
                    "link": "URL khóa học",
                    "reason": "Giải thích ngắn gọn tại sao khóa này giúp ích",
                    "isFree": true
                }
            ]
        }`;

        // Gọi hàm Gemini
        const aiData = await aiService.generateWithFallback(prompt, true);

        // Lưu vào Database
        const newRoadmap = await Roadmap.findOneAndUpdate(
            { sourceId },
            {
                userId: req.user.id,
                sourceId,
                testType,
                timeframe,
                goal,
                content: aiData
            },
            { new: true, upsert: true } // Nếu chưa có thì tạo mới, có rồi thì cập nhật
        );

        return res.json(newRoadmap);
    } catch (error) {
        console.error("Lỗi tạo Roadmap:", error);
        return res.status(500).json({ message: "Lỗi tạo lộ trình: " + error.message });
    }
};