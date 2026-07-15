const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Khởi tạo OpenAI
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY || 'MISSING_KEY' 
});

// Hàm gọi AI tích hợp "Smart Fallback"
async function generateWithFallback(prompt, isJson = true, temp = null) {
    // [QUAN TRỌNG NHẤT]: Đưa model "gemini-2.5-pro" của bạn trở lại vị trí đầu tiên
    const modelsToTry = [
        "gemini-2.5-pro",         // Model gốc của bạn, dùng cho API trả phí
        "gemini-2.0-flash",       
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-pro"              // Fallback cuối cùng
    ]; 
    
    let lastError;
    
    for (const modelName of modelsToTry) {
        try {
            // Mặc định temp là 0.7 cho JSON. Nếu có truyền temp vào sẽ dùng temp đó
            let temperature = temp !== null ? temp : (isJson ? 0.7 : 0.8);
            const generationConfig = { temperature: temperature };
                
            // Chỉ ép định dạng JSON cho các model thế hệ mới hỗ trợ tính năng này
            if (isJson && (modelName.includes("1.5") || modelName.includes("2.0") || modelName.includes("2.5"))) {
                generationConfig.responseMimeType = "application/json";
            }

            const model = genAI.getGenerativeModel({ 
                model: modelName, 
                generationConfig 
            });

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
            lastError = error;
            // Tự động bỏ qua lỗi và thử model tiếp theo
        }
    }
    throw new Error("Tất cả các model AI đều bị lỗi API: " + (lastError?.message || "Vui lòng kiểm tra lại GEMINI_API_KEY"));
}

async function generateSpeech(text) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'MISSING_KEY') {
            return null;
        }
        
        const mp3 = await openai.audio.speech.create({ 
            model: "tts-1", 
            voice: "shimmer",
            input: text 
        });
        
        const buffer = Buffer.from(await mp3.arrayBuffer());
        return buffer.toString('base64');
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
        const aiResponse = await generateWithFallback(finalPrompt, true); 
        const fullResponse = `${aiResponse.feedback} ${aiResponse.nextQuestion}`;
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

// 3. Logic bóc tách CV từ PDF
exports.parseCVForTemplate = async (pdfText) => {
    const prompt = `
    Bạn là một chuyên gia ATS Parser. Hãy trích xuất dữ liệu từ văn bản CV dưới đây thành JSON.

    QUY TẮC NGHIÊM NGẶT:
    1. Trích xuất chính xác, KHÔNG THÊM THẮT. Nếu không có thông tin, GÁN CHUỖI RỖNG "".
    2. Tách rõ từng object trong các mảng (education, experience, activities, certificates).
    3. BẮT BUỘC trả về đúng cấu trúc JSON sau:

    {
      "personal": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "dob": "", "gender": "", "address": "", "link": "" },
      "objective": "",
      "education": [ { "school": "", "major": "", "time": "", "description": "" } ],
      "experience": [ { "company": "", "position": "", "time": "", "description": "" } ],
      "activities": [ { "organization": "", "role": "", "time": "", "description": "" } ],
      "certificates": [ { "name": "", "time": "" } ],
      "skills": "",
      "hobbies": ""
    }

    NỘI DUNG CV:
    ${pdfText}
    `;

    try {
        const result = await generateWithFallback(prompt, true, 0);
        
        // Đảm bảo dữ liệu mảng không bị null gây lỗi map() ở frontend
        if (!result.education) result.education = [{ school: "", major: "", time: "", description: "" }];
        if (!result.experience) result.experience = [{ company: "", position: "", time: "", description: "" }];
        if (!result.activities) result.activities = [{ organization: "", role: "", time: "", description: "" }];
        if (!result.certificates) result.certificates = [{ name: "", time: "" }];
        
        return result;
    } catch (error) {
        throw new Error("Lỗi parse AI: " + error.message);
    }
};