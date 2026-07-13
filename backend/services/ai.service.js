const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");

// Khởi tạo Gemini (Xử lý Text & JSON)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Khởi tạo OpenAI (Xử lý Giọng nói - Text-to-Speech)
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY || 'MISSING_KEY' 
});

// Hàm dùng chung để gọi Gemini kèm tự động sửa lỗi JSON
async function generateWithFallback(prompt, isJson = true) {
    // Ưu tiên dùng model mới nhất, nếu lỗi sẽ fallback nghiệm thu
    const modelsToTry = ["gemini-2.5-pro", "gemini-1.5-flash"]; 
    
    for (const modelName of modelsToTry) {
        try {
            const config = isJson 
                ? { responseMimeType: "application/json", temperature: 0.7 } 
                : { temperature: 0.8 };
                
            const model = genAI.getGenerativeModel({ model: modelName, generationConfig: config });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            if (isJson) {
                // Làm sạch format markdown code block trước khi parse
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            }
            
            return text;
        } catch (error) {
            console.warn(`⚠️ Model ${modelName} thất bại:`, error.message);
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                throw new Error("Dịch vụ AI đang bảo trì hoặc trả về định dạng lỗi.");
            }
        }
    }
}

// Hàm chuyển văn bản thành giọng nói bằng OpenAI
async function generateSpeech(text) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("⚠️ Thiếu OPENAI_API_KEY. Bỏ qua tạo giọng nói.");
            return null;
        }
        
        const mp3 = await openai.audio.speech.create({ 
            model: "tts-1", 
            voice: "shimmer", // Có thể đổi thành: alloy, echo, fable, onyx, nova
            input: text 
        });
        
        const buffer = Buffer.from(await mp3.arrayBuffer());
        return buffer.toString('base64'); // Trả về base64 để frontend chạy trực tiếp
    } catch (error) { 
        console.error("Lỗi OpenAI TTS:", error.message);
        return null; 
    }
}

// 1. Logic xử lý hội thoại phỏng vấn
exports.conductMockInterview = async (conversationHistory, jobPosition) => {
    const systemPrompt = `
    Bạn là một chuyên gia phỏng vấn cấp cao đang tuyển dụng vị trí: ${jobPosition}.
    
    QUY TẮC HỘI THOẠI:
    1. Trình tự phản hồi: 
       - Đưa ra nhận xét ngắn gọn về câu trả lời vừa rồi của ứng viên.
       - Dựa trực tiếp vào ngữ cảnh đó để đặt DUY NHẤT 1 câu hỏi chuyên sâu tiếp theo.
    2. Giọng văn: Chuyên nghiệp, khách quan nhưng cởi mở.
    3. Định dạng trả về JSON: {"feedback": "Nhận xét của bạn", "nextQuestion": "Câu hỏi tiếp theo"}.
    `;

    const historyString = conversationHistory.map(msg => 
        `${msg.role === 'user' ? 'Ứng viên' : 'Người phỏng vấn'}: ${msg.content}`
    ).join('\n');

    const finalPrompt = `${systemPrompt}\n\nLỊCH SỬ PHỎNG VẤN:\n${conversationHistory.length === 0 ? "Bắt đầu phỏng vấn." : historyString}\n\nPhản hồi tiếp theo:`;

    try {
        // Dùng Gemini để sinh văn bản trả lời
        const aiResponse = await generateWithFallback(finalPrompt, true); 
        const fullResponse = `${aiResponse.feedback} ${aiResponse.nextQuestion}`;
        
        // Dùng OpenAI để chuyển văn bản đó thành Audio
        const audioBase64 = await generateSpeech(fullResponse);
        
        return {
            ...aiResponse,
            fullText: fullResponse, 
            audioData: audioBase64 || ""
        };
    } catch (error) {
        console.error("AI Interview Error:", error);
        return { 
            feedback: "Cảm ơn chia sẻ của bạn.", 
            nextQuestion: "Bạn có thể nói rõ hơn về kinh nghiệm thực tế của mình không?", 
            audioData: "" 
        };
    }
};

// 2. Logic đánh giá sau khi kết thúc phỏng vấn
exports.evaluateInterview = async (history, jobPosition) => {
    const transcript = history.map(msg => 
        `${msg.role === 'user' ? 'Ứng viên' : 'Nhà tuyển dụng'}: ${msg.content}`
    ).join('\n');

    const prompt = `
    Đóng vai là một chuyên gia tuyển dụng cao cấp. Hãy đánh giá cuộc phỏng vấn thử cho vị trí "${jobPosition}" dựa trên nội dung sau:
    
    --- BẮT ĐẦU HỘI THOẠI ---
    ${transcript}
    --- KẾT THÚC HỘI THOẠI ---

    Hãy trả về kết quả dưới dạng JSON chuẩn với cấu trúc sau:
    {
        "score": 85,
        "overview": "Nhận xét tổng quan ngắn gọn...",
        "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
        "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
        "improvements": ["Lời khuyên cải thiện 1"]
    }
    `;

    try {
        return await generateWithFallback(prompt, true);
    } catch (error) {
        console.error("Evaluation Error:", error);
        return {
            score: 0,
            overview: "Hệ thống không thể đánh giá chi tiết lúc này do lỗi máy chủ.",
            strengths: [],
            weaknesses: [],
            improvements: ["Vui lòng thực hiện lại bài phỏng vấn"]
        };
    }
};