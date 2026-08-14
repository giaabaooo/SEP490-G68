const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Khởi tạo OpenAI
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY || 'MISSING_KEY' 
});

// Hàm gọi AI tích hợp "Smart Fallback"
// Hàm gọi AI tích hợp "Smart Fallback"
async function generateWithFallback(prompt, isJson = true, temp = null) {
    const modelsToTry = [
        "gemini-2.5-pro",
        "gemini-2.0-flash",       
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-pro"
    ]; 
    
    let lastError;
    
    for (const modelName of modelsToTry) {
        try {
            let temperature = temp !== null ? temp : (isJson ? 0.2 : 0.7); // Giảm temp xuống 0.2 để AI bớt "sáng tạo" format
            const generationConfig = { temperature: temperature };
                
            if (isJson && (modelName.includes("1.5") || modelName.includes("2.0") || modelName.includes("2.5"))) {
                generationConfig.responseMimeType = "application/json";
            }

            const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
            const result = await model.generateContent(prompt);
            let text = await result.response.text();

            if (isJson) {
                // TÌM CHÍNH XÁC ĐOẠN JSON ĐỂ BÓC TÁCH (Bảo vệ tuyệt đối khỏi Markdown)
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1) {
                    text = text.substring(firstBrace, lastBrace + 1);
                } else {
                    text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
                }
                
                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    throw new Error("Lỗi Parse: AI không trả về chuẩn JSON.");
                }
            }
            
            return text;
        } catch (error) {
            console.warn(`⚠️ Model ${modelName} thất bại:`, error.message);
            lastError = error;
        }
    }
    throw new Error("Tất cả models đều lỗi: " + (lastError?.message || "Vui lòng kiểm tra lại GEMINI_API_KEY"));
}
exports.generateWithFallback = generateWithFallback;

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
// Export để dùng ở controller
exports.textToSpeech = generateSpeech; 

// --- [HÀM MỚI] 0. Logic sinh danh sách câu hỏi tĩnh cho Job Position ---
exports.generateQuestionsList = async (jobPosition) => {
    const prompt = `
    Đóng vai là một Giám đốc nhân sự (HR Director). 
    Hãy chuẩn bị một danh sách gồm 5 câu hỏi phỏng vấn chuẩn mực dành cho vị trí: "${jobPosition}".
    
    YÊU CẦU:
    1. Câu 1 luôn là câu hỏi giới thiệu bản thân.
    2. Câu 2-4 là câu hỏi chuyên môn/kỹ năng cứng.
    3. Câu 5 là câu hỏi về tình huống/kỹ năng mềm.
    4. Trả về đúng định dạng MẢNG JSON, không có text dư thừa.

    VÍ DỤ ĐỊNH DẠNG TRẢ VỀ:
    [
        "Chào bạn, bạn có thể giới thiệu đôi nét về bản thân và kinh nghiệm làm việc được không?",
        "Câu hỏi chuyên môn 1...",
        "Câu hỏi chuyên môn 2...",
        "Câu hỏi chuyên môn 3...",
        "Câu hỏi tình huống..."
    ]
    `;

    try {
        // Dùng temp = 0.5 để câu hỏi ổn định, không quá bay bổng
        const result = await generateWithFallback(prompt, true, 0.5);
        if (Array.isArray(result) && result.length > 0) {
            return result;
        }
        throw new Error("AI không trả về mảng câu hỏi hợp lệ");
    } catch (error) {
        console.error("Generate Questions List Error:", error);
        // Fallback mặc định nếu AI lỗi để tránh block flow
        return [
            `Chào bạn, hãy giới thiệu đôi nét về bản thân và lý do bạn ứng tuyển vị trí ${jobPosition}?`,
            `Bạn có kinh nghiệm gì nổi bật liên quan đến vị trí ${jobPosition} này?`,
            `Khó khăn lớn nhất bạn từng gặp trong công việc là gì và cách bạn vượt qua?`,
            `Bạn thường làm gì để cập nhật kiến thức mới trong lĩnh vực này?`,
            `Bạn có câu hỏi nào dành cho công ty chúng tôi không?`
        ];
    }
};

// 1. Logic xử lý hội thoại phỏng vấn
exports.conductMockInterview = async (conversationHistory, jobPosition) => {
    // Logic trong phần này giờ sẽ được Controller điều hướng. 
    // Nếu Controller thấy hết câu hỏi cứng, nó có thể gọi hàm này để AI sinh câu tuỳ biến 
    // (nhưng theo luồng mới của chúng ta, Controller đã dùng danh sách cố định)
    
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
exports.evaluateCVMatch = async (job, cvText) => {
    // 1. Lấy danh sách tiêu chí, fallback an toàn
    const categories = (job.requirementCategories && job.requirementCategories.length > 0) 
        ? job.requirementCategories 
        : [{ name: "Đánh giá chung (Skill & Kinh nghiệm)", weight: 100, isKey: true }];

    try {
        const catPromptText = categories.map((c, index) => 
            `- "${c.name}" (Trọng số: ${c.weight}%, Trọng điểm: ${c.isKey ? 'CÓ' : 'KHÔNG'})`
        ).join('\n');

        const prompt = `
        Bạn là hệ thống AI đánh giá CV. Chấm điểm CV ứng viên dựa trên JD.
        
        --- THÔNG TIN CÔNG VIỆC ---
        - Tiêu đề: ${job.title}
        - Mô tả: ${job.description}
        
        --- TIÊU CHÍ CẦN CHẤM ---
        ${catPromptText}

        --- CV ỨNG VIÊN ---
        ${cvText}

        --- YÊU CẦU ĐẦU RA ---
        Chỉ trả về JSON theo đúng định dạng sau, KHÔNG dùng // để comment:
        {
            "verdict": "Tuyệt vời / Tiềm năng / Chưa phù hợp",
            "reasonToHire": "Lý do nên nhận",
            "reasonToReject": "Điểm yếu lớn nhất",
            "categoryScores": [
                {
                    "name": "Copy chính xác tên tiêu chí ở trên",
                    "score": 85,
                    "feedback": "Nhận xét cụ thể"
                }
            ],
            "advice": "Gợi ý cải thiện"
        }
        Lưu ý: "categoryScores" BẮT BUỘC phải có đúng ${categories.length} object.
        `;

        const result = await generateWithFallback(prompt, true, 0.2); 
        
        let totalWeightedScore = 0;
        let finalCategoryScores = [];

        categories.forEach((cat) => {
            const aiCatResult = result.categoryScores?.find(c => 
                c.name && c.name.toLowerCase().includes(cat.name.toLowerCase())
            ) || { score: 0, feedback: "AI chưa đánh giá được tiêu chí này do thiếu thông tin." };
            
            const rawScore = Number(aiCatResult.score) || 0;
            const weightedScore = rawScore * (cat.weight / 100);
            totalWeightedScore += weightedScore;

            finalCategoryScores.push({
                name: cat.name,
                weight: cat.weight,
                isKey: cat.isKey,
                rawScore: rawScore,
                weightedScore: weightedScore,
                feedback: aiCatResult.feedback || "Không có nhận xét."
            });
        });

        return { 
            score: Math.round(totalWeightedScore), 
            verdict: result.verdict || "Chưa đánh giá",
            reasonToHire: result.reasonToHire || "",
            reasonToReject: result.reasonToReject || "",
            categoryScores: finalCategoryScores, 
            advice: result.advice || ""
        };

    } catch (error) {
        console.error("Lỗi AI đánh giá CV chi tiết:", error);
        
        // SỬA LỖI TRẮNG UI: Trả về chính xác các tiêu chí nhưng với điểm 0 để UI render được mảng
        return { 
            score: 0, 
            verdict: "Lỗi Server", 
            reasonToHire: "Không thể phân tích lúc này.", 
            reasonToReject: "Chi tiết lỗi AI: " + error.message, 
            categoryScores: categories.map(cat => ({
                name: cat.name,
                weight: cat.weight,
                isKey: cat.isKey,
                rawScore: 0,
                weightedScore: 0,
                feedback: "Lỗi hệ thống hoặc quá tải API, vui lòng nộp lại!"
            })), 
            advice: "Hãy liên hệ HR hoặc thử lại sau." 
        };
    }
};
exports.calculateJobMatch = async (profileText, jobDescription) => {
    const prompt = `
    Bạn là một Chuyên gia Tuyển dụng cấp cao (Senior Talent Acquisition / Headhunter).
    Nhiệm vụ của bạn là phân tích độ phù hợp giữa Hồ sơ ứng viên (CV) và Mô tả công việc (JD), sau đó đưa ra lời khuyên ĐẶC BIỆT CHI TIẾT để ứng viên sửa CV.

    QUY TẮC ĐÁNH GIÁ:
    1. Chấm điểm khắt khe (0-100). Nếu thiếu kỹ năng cốt lõi, điểm phải dưới 50.
    2. Phần 'advice' (Gợi ý chỉnh sửa) PHẢI CỰC KỲ CHI TIẾT. Không nói chung chung "cần bổ sung kỹ năng". Bạn phải:
       - Chỉ ra chính xác kỹ năng/từ khóa nào đang thiếu.
       - Cung cấp VÍ DỤ CỤ THỂ về cách viết lại một gạch đầu dòng trong CV để ghi điểm với HR.
       - Điểm càng thấp, phần advice càng phải dài và hướng dẫn chi tiết từng bước.
       - Viết liền mạch, xuống dòng bằng \\n để dễ đọc.

    --- HỒ SƠ ỨNG VIÊN ---
    ${profileText}

    --- MÔ TẢ CÔNG VIỆC ---
    ${jobDescription}

    --- YÊU CẦU KẾT QUẢ TRẢ VỀ (JSON CHUẨN) ---
    {
        "score": <Điểm 0-100>,
        "verdict": "Rất phù hợp / Cần bổ sung nhiều / Khá phù hợp...",
        "pros": ["Điểm mạnh 1 phân tích chi tiết", "Điểm mạnh 2..."],
        "cons": ["Điểm yếu 1 phân tích chi tiết", "Điểm yếu 2..."],
        "advice": "Đoạn văn hướng dẫn chi tiết. Có ví dụ cụ thể về cách đặt câu văn trong CV..."
    }
    `;

    try {
        return await generateWithFallback(prompt, true, 0.5);
    } catch (error) {
        console.error("AI Match Error:", error);
        return { score: 0, verdict: "Lỗi phân tích", pros: [], cons: [], advice: "Không thể phân tích lúc này." };
    }
};