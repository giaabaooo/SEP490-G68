const aiService = require('../services/ai.service');

// Khởi tạo phỏng vấn / Chat tiếp theo
exports.conductInterview = async (req, res) => {
    try {
        const { history, jobPosition } = req.body;
        
        // TẠM THỜI COMMENT LOGIC LIMIT: Luôn cho phép phỏng vấn
        const result = await aiService.conductMockInterview(history || [], jobPosition);
        
        // Trả về thời gian ảo rất lớn để FE không báo hết giờ
        res.json({ ...result, remainingTime: 99999 });
    } catch (error) {
        console.error("Conduct Interview Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Đánh giá kết quả phỏng vấn
exports.evaluateInterview = async (req, res) => {
    try {
        const { history, jobPosition } = req.body;
        const result = await aiService.evaluateInterview(history, jobPosition);
        res.json(result);
    } catch (err) {
        console.error("Evaluate Interview Error:", err);
        res.status(500).json({ message: "Lỗi server khi đánh giá" });
    }
};

// Đồng bộ thời gian sử dụng
exports.syncUsage = async (req, res) => {
    try {
        // TẠM THỜI BYPASS LOGIC DB: Trả về success luôn để tránh lỗi 500
        res.json({ success: true });
    } catch (error) { 
        res.status(500).json({ message: "Lỗi đồng bộ: " + error.message }); 
    }
};