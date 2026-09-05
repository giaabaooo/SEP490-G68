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
                // TÌM CHÍNH XÁC ĐOẠN JSON ĐỂ BÓC TÁCH (Hỗ trợ cả Object {} và Mảng [])
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                const firstBracket = text.indexOf('[');
                const lastBracket = text.lastIndexOf(']');

                // Nếu là Mảng JSON []
                if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
                    text = text.substring(firstBracket, lastBracket + 1);
                } else if (firstBrace !== -1 && lastBrace !== -1) {
                    // Nếu là Object JSON {}
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

// 1. Logic xử lý hội thoại phỏng vấn bám sát JD, hỏi đáp tự nhiên 2 chiều & cá nhân hóa
exports.conductMockInterview = async (conversationHistory, jobContext, candidateContext) => {
    const jobTitle = typeof jobContext === 'object' ? (jobContext.title || jobContext.jobPosition || 'Chuyên viên kỹ thuật') : (jobContext || 'Chuyên viên kỹ thuật');
    const jobCompany = typeof jobContext === 'object' ? (jobContext.company || jobContext.companyName || 'Doanh nghiệp tuyển dụng') : 'Doanh nghiệp tuyển dụng';
    const jobDescription = typeof jobContext === 'object' ? (jobContext.description || '') : '';
    const jobRequirements = typeof jobContext === 'object' ? (Array.isArray(jobContext.requirements) ? jobContext.requirements.join('\n- ') : (jobContext.requirements || '')) : '';
    const jobTags = typeof jobContext === 'object' ? (Array.isArray(jobContext.tags) ? jobContext.tags.join(', ') : (jobContext.tags || '')) : '';
    
    const candidateName = candidateContext?.fullName || 'Ứng viên';
    const candidateSkills = Array.isArray(candidateContext?.skills) ? candidateContext.skills.join(', ') : (candidateContext?.skills || 'Chưa cập nhật');
    const candidateExperience = candidateContext?.experience || '';
    const candidateEducation = candidateContext?.education || '';

    const userAnswersCount = (conversationHistory || []).filter(msg => msg.role === 'user').length;
    // Cho phép phỏng vấn tự nhiên theo nhu cầu luyện tập của ứng viên, không gò bó cố định 5 câu
    const isClosingTurn = userAnswersCount >= 10;

    const systemPrompt = `
    Đóng vai trò là Trưởng bộ phận tuyển dụng kiêm Chuyên gia kỹ thuật cấp cao (Senior Technical Interviewer & Hiring Lead) của công ty "${jobCompany}".
    Bạn đang trực tiếp phỏng vấn 1:1 với ứng viên "${candidateName}" cho vị trí: "${jobTitle}".

    THÔNG TIN MÔ TẢ CÔNG VIỆC (JD):
    - Vị trí: ${jobTitle}
    - Công ty: ${jobCompany}
    - Mô tả công việc: ${jobDescription || 'Theo tiêu chuẩn chuyên môn vị trí ' + jobTitle}
    - Yêu cầu ứng viên (Requirements): 
    ${jobRequirements ? (jobRequirements.startsWith('-') ? jobRequirements : '- ' + jobRequirements) : '- Thành thạo kỹ năng chuyên môn liên quan đến ' + jobTitle}
    - Kỹ năng trọng điểm: ${jobTags || jobTitle}

    HỒ SƠ ỨNG VIÊN (CÁ NHÂN HOÁ DỰA TRÊN CV):
    - Họ tên: ${candidateName}
    - Kỹ năng của ứng viên: ${candidateSkills}
    ${candidateExperience ? `- Kinh nghiệm đã có: ${candidateExperience}` : ''}
    ${candidateEducation ? `- Học vấn: ${candidateEducation}` : ''}

    NGUYÊN TẮC HỎI - ĐÁP TỰ NHIÊN & ĐỒNG HÀNH (CONVERSATIONAL & SUPPORTIVE MENTOR):
    1. BẮT ĐẦU BUỔI PHỎNG VẤN (Nếu lịch sử hội thoại chưa có câu hỏi nào):
       - Chào đón ứng viên bằng tên thân mật nhưng lịch sự ("Chào ${candidateName}, ..."), giới thiệu ngắn gọn công ty và vị trí.
       - Đặt câu hỏi mở đầu khơi gợi ứng viên giới thiệu bản thân và kinh nghiệm nổi bật nhất gắn liền với yêu cầu của JD.
       - Trường "feedback" để trống ("").
       - Trường "hint": Đưa ra 1 gợi ý ngắn gọn giúp ứng viên tự tin trả lời (ví dụ: mẹo tóm tắt trong 1-2 phút, tập trung vào kỹ năng khớp với JD).
       - Trường "isFinished": false.

    2. CÁC LƯỢT ĐỐI THOẠI TIẾP THEO (Ứng viên vừa trả lời câu hỏi trước):
       - QUY TRÌNH HỎI ĐÁP TỰ NHIÊN:
       - BƯỚC 1: "feedback" (Phản hồi & Nhận xét):
         * Đọc kỹ câu trả lời vừa rồi của ứng viên.
         * Đưa ra nhận xét ngắn gọn (1 - 3 câu): Khen ngợi điểm đúng, chỉ ra tính khả thi/chiều sâu kỹ thuật, hoặc chỉ ra góc nhìn thực tế còn thiếu.
         * Nếu ứng viên trả lời quá ngắn, chưa biết hoặc ấp úng: Hãy khích lệ, động viên nhẹ nhàng và khéo léo chuyển sang khía cạnh liên quan ("Không sao cả, trong thực tế vấn đề này thường được tiếp cận...").
       - BƯỚC 2: "nextQuestion" (Câu hỏi tiếp nối):
         * Đào sâu (follow-up) vào công nghệ/dự án/tình huống cụ thể mà ứng viên VỪA NÊU trong câu trả lời, đối chiếu với yêu cầu trong JD.
         * HOẶC chuyển tiếp tự nhiên sang một tiêu chí kỹ thuật/tình huống quan trọng tiếp theo trong JD (ví dụ: tối ưu hiệu năng, bảo mật, xử lý lỗi, phối hợp nhóm, giải quyết sự cố).
       - BƯỚC 3: "hint" (Gợi ý trả lời hỗ trợ ứng viên):
         * Cung cấp 1 gợi ý định hướng súc tích (1-2 câu) để giúp ứng viên biết cách cấu trúc câu trả lời (như áp dụng mô hình STAR: Situation - Task - Action - Result, hoặc các từ khóa công nghệ then chốt cần nhắc tới).
       - Trường "isFinished": false.

    3. NẾU CUỘC PHỎNG VẤN ĐÃ ĐI VÀO CHIỀU SÂU VÀ HOÀN TẤT (isClosingTurn = ${isClosingTurn}):
       - Đưa ra lời nhận xét tổng kết ngắn gọn, ấm áp và chuyên nghiệp về toàn bộ buổi phỏng vấn.
       - Mời ứng viên bấm nút "Kết thúc phỏng vấn" để xem báo cáo đánh giá chi tiết và điểm số.
       - "feedback": Lời nhận xét tổng kết.
       - "nextQuestion": "Buổi phỏng vấn đã bao quát đầy đủ các yêu cầu cốt lõi. Bạn có thể tiếp tục chia sẻ hoặc bấm nút 'Kết thúc phỏng vấn' bất cứ lúc nào để nhận báo cáo phân tích chi tiết nhé!"
       - "hint": "Nhấn nút Kết thúc để nhận báo cáo phân tích.",
       - "isFinished": true.

    ĐỊNH DẠNG TRẢ VỀ JSON BẮT BUỘC:
    {
        "feedback": "Phản hồi/nhận xét ngắn gọn về câu trả lời vừa rồi (để trống ở câu đầu tiên)",
        "nextQuestion": "Câu hỏi tiếp theo hoặc thông báo kết thúc",
        "hint": "Gợi ý trả lời cho câu hỏi này giúp ứng viên học hỏi và trả lời tự tin hơn",
        "isFinished": false
    }
    `;

    const historyString = (conversationHistory || []).map(msg => 
        `${msg.role === 'user' ? 'Ứng viên' : 'Người phỏng vấn'}: ${msg.content}`
    ).join('\n');

    const finalPrompt = `${systemPrompt}\n\nLỊCH SỬ HỘI THOẠI HIỆN TẠI:\n${(!conversationHistory || conversationHistory.length === 0) ? "[Chưa có hội thoại, hãy bắt đầu câu hỏi chào đón mở đầu]" : historyString}\n\nHãy phản hồi bằng JSON:`;

    try {
        const aiResponse = await generateWithFallback(finalPrompt, true, 0.4); 
        const feedback = aiResponse.feedback ? aiResponse.feedback.trim() : "";
        const nextQuestion = aiResponse.nextQuestion ? aiResponse.nextQuestion.trim() : "";
        const hint = aiResponse.hint ? aiResponse.hint.trim() : "";
        const isFinished = Boolean(aiResponse.isFinished || isClosingTurn);

        // Nối feedback và nextQuestion để hiển thị và phát âm thanh tự nhiên
        const fullText = feedback ? `${feedback}\n\n${nextQuestion}` : nextQuestion;
        
        let audioBase64 = null;
        try {
            audioBase64 = await generateSpeech(fullText);
        } catch (audioErr) {
            console.warn("Speech generation warning:", audioErr.message);
        }
        
        return {
            feedback,
            nextQuestion,
            hint,
            fullText, 
            audioData: audioBase64 || "",
            isFinished
        };
    } catch (error) {
        console.error("AI Interview Error:", error);
        return { 
            feedback: "Cảm ơn chia sẻ của bạn.", 
            nextQuestion: `Dựa trên yêu cầu của vị trí ${jobTitle}, bạn có thể chia sẻ sâu hơn về một dự án thực tế bạn từng gặp khó khăn và cách giải quyết không?`, 
            hint: "Hãy dùng phương pháp STAR: Nêu bối cảnh dự án, khó khăn cụ thể, giải pháp kỹ thuật bạn áp dụng và kết quả cuối cùng.",
            fullText: `Cảm ơn chia sẻ của bạn.\n\nDựa trên yêu cầu của vị trí ${jobTitle}, bạn có thể chia sẻ sâu hơn về một dự án thực tế bạn từng gặp khó khăn và cách giải quyết không?`,
            audioData: "",
            isFinished: false
        };
    }
};

// 2. Logic đánh giá sau khi kết thúc phỏng vấn bám sát JD & cá nhân hóa
exports.evaluateInterview = async (history, jobContext, candidateContext) => {
    const jobTitle = typeof jobContext === 'object' ? (jobContext.title || jobContext.jobPosition || 'Chuyên viên kỹ thuật') : (jobContext || 'Chuyên viên kỹ thuật');
    const jobCompany = typeof jobContext === 'object' ? (jobContext.company || jobContext.companyName || 'Doanh nghiệp') : 'Doanh nghiệp';
    const jobDescription = typeof jobContext === 'object' ? (jobContext.description || '') : '';
    const jobRequirements = typeof jobContext === 'object' ? (Array.isArray(jobContext.requirements) ? jobContext.requirements.join('\n- ') : (jobContext.requirements || '')) : '';
    
    const candidateName = candidateContext?.fullName || 'Ứng viên';
    const candidateSkills = Array.isArray(candidateContext?.skills) ? candidateContext.skills.join(', ') : (candidateContext?.skills || '');

    const transcript = (history || []).map(msg => 
        `${msg.role === 'user' ? 'Ứng viên' : 'Người phỏng vấn'}: ${msg.content}`
    ).join('\n');

    const prompt = `
    Đóng vai là một Giám đốc tuyển dụng và Chuyên gia kỹ thuật cấp cao cực kỳ công tâm, sâu sắc.
    Hãy đánh giá toàn diện buổi phỏng vấn thử của ứng viên đối chiếu trực tiếp với yêu cầu của Mô tả công việc (JD):

    VỊ TRÍ TUYỂN DỤNG & YÊU CẦU CÔNG VIỆC:
    - Vị trí: ${jobTitle} (${jobCompany})
    ${jobDescription ? `- Mô tả công việc: ${jobDescription}` : ''}
    ${jobRequirements ? `- Yêu cầu kỹ năng (JD): \n${jobRequirements}` : ''}

    THÔNG TIN ỨNG VIÊN:
    - Họ và tên: ${candidateName}
    ${candidateSkills ? `- Kỹ năng: ${candidateSkills}` : ''}

    --- BIÊN BẢN HỘI THOẠI PHỎNG VẤN ---
    ${transcript}
    --- KẾT THÚC BIÊN BẢN ---

    TIÊU CHÍ ĐÁNH GIÁ NGHIÊM NGẶT:
    1. Trọng tâm là câu trả lời của Ứng viên đối chiếu với yêu cầu thực tế trong JD.
    2. Nếu ứng viên chỉ trả lời cụt lủn, sáo rỗng hoặc từ chối trả lời ("dạ", "em không biết", "chào anh"), điểm tối đa chỉ từ 0 đến 15 điểm.
    3. Đánh giá độ phù hợp với JD: Ứng viên có nắm vững các công nghệ trọng tâm trong JD không? Có tư duy thực chiến và giải quyết được bài toán kỹ thuật không?
    4. Cho điểm trên 75 nếu ứng viên đưa ra được ví dụ dự án cụ thể, số liệu hoặc phân tích sâu sắc.

    Hãy trả về kết quả JSON chuẩn với cấu trúc:
    {
        "score": <Số điểm nguyên từ 0 đến 100>,
        "matchRating": "Đánh giá mức độ phù hợp JD ngắn gọn (Ví dụ: Phù hợp 85% với yêu cầu JD vị trí Senior Frontend)",
        "overview": "Nhận xét tổng quan toàn diện và mang tính xây dựng về năng lực ứng viên so với JD...",
        "strengths": [
            "Điểm mạnh nổi bật 1 (gắn với yêu cầu công việc)",
            "Điểm mạnh 2"
        ],
        "weaknesses": [
            "Điểm yếu hoặc kiến thức còn thiếu so với JD 1",
            "Điểm yếu 2"
        ],
        "improvements": [
            "Lời khuyên thiết thực để ứng viên vượt qua phỏng vấn thật cho vị trí này 1",
            "Lời khuyên 2"
        ]
    }
    `;

    try {
        return await generateWithFallback(prompt, true, 0.2); // Hạ Temperature xuống 0.2 để AI tập trung logic hơn
    } catch (error) {
        console.error("Evaluation Error:", error);
        return {
            score: 0,
            matchRating: "Chưa thể đánh giá độ phù hợp do lỗi mạng",
            overview: "Hệ thống không thể đánh giá chi tiết lúc này do lỗi kết nối AI.",
            strengths: [],
            weaknesses: ["Chưa có dữ liệu do lỗi mạng"],
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
const getEffectiveCategories = (job) => {
    // 1. Nếu job có các Bands cụ thể
    if (job.requirementCategories && Array.isArray(job.requirementCategories)) {
        const validCats = job.requirementCategories.filter(c => c && c.name && c.name.trim() && c.name.trim() !== 'Đánh giá chung');
        if (validCats.length > 0) {
            const totalW = validCats.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
            if (totalW === 100) {
                return validCats.map(c => ({ name: c.name.trim(), weight: Number(c.weight), isKey: !!c.isKey }));
            } else if (totalW > 0) {
                return validCats.map(c => ({
                    name: c.name.trim(),
                    weight: Math.round(((Number(c.weight) || 0) / totalW) * 100),
                    isKey: !!c.isKey
                }));
            } else {
                const avgW = Math.floor(100 / validCats.length);
                return validCats.map((c, i) => ({
                    name: c.name.trim(),
                    weight: i === validCats.length - 1 ? 100 - avgW * (validCats.length - 1) : avgW,
                    isKey: !!c.isKey
                }));
            }
        }
    }

    // 2. Nếu rỗng hoặc chỉ có "Đánh giá chung", thử trích xuất từ job.requirements
    if (job.requirements) {
        const reqStr = Array.isArray(job.requirements) ? job.requirements.join('\n') : String(job.requirements);
        const lines = reqStr.split('\n').map(l => l.trim()).filter(l => l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+\./.test(l));
        
        const extracted = [];
        for (const line of lines) {
            const cleanLine = line.replace(/^[-*•\d.]+\s*/, '').trim();
            const weightMatch = cleanLine.match(/\((\d+)%\s*(-?\s*Trọng điểm)?\)/i);
            if (weightMatch) {
                const weight = parseInt(weightMatch[1], 10);
                const isKey = !!weightMatch[2];
                const name = cleanLine.replace(/\(\d+%\s*(-?\s*Trọng điểm)?\)/i, '').trim();
                if (name && name.length >= 3) {
                    extracted.push({ name, weight, isKey });
                }
            } else if (cleanLine.length >= 8 && cleanLine.length <= 120) {
                extracted.push({ name: cleanLine, weight: 0, isKey: false });
            }
        }

        if (extracted.length >= 2) {
            const totalW = extracted.reduce((sum, c) => sum + c.weight, 0);
            if (totalW === 100) {
                return extracted;
            } else if (totalW > 0) {
                return extracted.map(c => ({ ...c, weight: Math.round((c.weight / totalW) * 100) }));
            } else {
                const avgW = Math.floor(100 / extracted.length);
                return extracted.map((c, i) => ({
                    ...c,
                    weight: i === extracted.length - 1 ? 100 - avgW * (extracted.length - 1) : avgW
                }));
            }
        }
    }

    // 3. Fallback tiêu chuẩn theo 4 đầu mục chuyên môn phổ quát
    return [
        { name: "Kỹ năng chuyên môn & Tech Stack cốt lõi", weight: 40, isKey: true },
        { name: "Kinh nghiệm thực tế & Dự án đã làm", weight: 30, isKey: true },
        { name: "Kiến thức nền tảng & Tư duy kỹ thuật", weight: 20, isKey: false },
        { name: "Mức độ phù hợp với yêu cầu tuyển dụng", weight: 10, isKey: false }
    ];
};

exports.evaluateCVMatch = async (job, cvText) => {
    // 1. Lấy danh sách đầu mục (Bands) tối ưu nhất
    const categories = getEffectiveCategories(job);

    try {
        const catPromptText = categories.map((c, index) => 
            `${index + 1}. [${c.name}] - Trọng số: ${c.weight}% | Trọng điểm: ${c.isKey ? 'CÓ' : 'KHÔNG'}`
        ).join('\n');

        const prompt = `
        Bạn là Hệ thống AI Chuyên gia Đánh giá Hồ sơ và Tuyển dụng Nhân tài (Senior Hiring Specialist).
        Nhiệm vụ của bạn là đánh giá và chấm điểm CV của ứng viên chi tiết THEO TỪNG ĐẦU MỤC YÊU CẦU CHUYÊN MÔN (BANDS) được liệt kê dưới đây.

        --- THÔNG TIN CÔNG VIỆC ---
        - Tiêu đề: ${job.title}
        - Mô tả công việc: ${job.description || 'Không có mô tả chi tiết'}
        - Yêu cầu tuyển dụng: ${Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || '')}

        --- CÁC ĐẦU MỤC YÊU CẦU CHUYÊN MÔN (BANDS CẦN ĐÁNH GIÁ ĐỘC LẬP) ---
        ${catPromptText}

        --- NỘI DUNG CV CỦA ỨNG VIÊN ---
        ${cvText}

        --- QUY TẮC ĐÁNH GIÁ TỪNG ĐẦU MỤC ---
        1. Bạn PHẢI đánh giá ĐỘC LẬP từng đầu mục trong danh sách trên.
        2. Với MỖI đầu mục:
           - "name": Copy chính xác tên đầu mục trong dấu ngoặc vuông [] ở trên (không sửa đổi).
           - "score": Điểm đánh giá năng lực của ứng viên cho RIÊNG đầu mục này trên thang điểm 100 (từ 0 đến 100).
             + 85 - 100: Vượt trội, đáp ứng trọn vẹn và xuất sắc tiêu chí.
             + 70 - 84: Tốt, đáp ứng hầu hết các yêu cầu trọng yếu.
             + 50 - 69: Trung bình / Tiềm năng, đáp ứng được một phần nhưng còn thiếu kinh nghiệm sâu.
             + Dưới 50: Yếu / Chưa đáp ứng, CV không có hoặc rất ít bằng chứng về tiêu chí này.
           - "feedback": Nhận xét chi tiết, công tâm (2-4 câu). Nêu rõ những điểm mạnh ứng viên đã thể hiện được trong CV cho đầu mục này, và những điểm còn thiếu/cần cải thiện.
        3. Mảng "categoryScores" BẮT BUỘC phải có đúng ${categories.length} phần tử tương ứng với từng đầu mục ở trên.

        --- ĐỊNH DẠNG JSON ĐẦU RA (BẮT BUỘC JSON HỢP LỆ, KHÔNG CHỨA BẤT KỲ KÝ TỰ NÀO NGOÀI JSON) ---
        {
            "verdict": "Tuyệt vời / Tiềm năng / Cần cân nhắc / Chưa phù hợp",
            "reasonToHire": "Điểm sáng giá và lý do nổi bật nhất nên mời ứng viên vào vòng phỏng vấn",
            "reasonToReject": "Điểm yếu lớn nhất hoặc rủi ro về năng lực so với yêu cầu của JD",
            "categoryScores": [
                {
                    "name": "Tên chính xác đầu mục",
                    "score": 85,
                    "feedback": "Nhận xét chi tiết cho đầu mục này"
                }
            ],
            "advice": "Lời khuyên ngắn gọn cho nhà tuyển dụng khi phỏng vấn ứng viên này"
        }
        `;

        const result = await generateWithFallback(prompt, true, 0.2); 
        
        let totalWeightedScore = 0;
        let finalCategoryScores = [];

        categories.forEach((cat) => {
            const aiCatResult = result.categoryScores?.find(c => {
                if (!c.name) return false;
                const cName = c.name.toLowerCase().trim();
                const targetName = cat.name.toLowerCase().trim();
                return cName === targetName || cName.includes(targetName) || targetName.includes(cName);
            }) || { score: 0, feedback: "Chưa có đủ thông tin trong CV để đánh giá đầu mục này." };
            
            const rawScore = Math.min(100, Math.max(0, Math.round(Number(aiCatResult.score) || 0)));
            const weightedScore = Number(((rawScore * cat.weight) / 100).toFixed(1));
            totalWeightedScore += weightedScore;

            finalCategoryScores.push({
                name: cat.name,
                weight: cat.weight,
                isKey: cat.isKey,
                rawScore: rawScore, // Điểm gốc thang 100 của riêng đầu mục
                weightedScore: weightedScore, // Điểm quy đổi đóng góp vào tổng
                feedback: aiCatResult.feedback || "Không có nhận xét."
            });
        });

        const finalScore = Math.min(100, Math.max(0, Math.round(totalWeightedScore)));

        return { 
            score: finalScore, 
            verdict: result.verdict || "Chưa đánh giá",
            reasonToHire: result.reasonToHire || "",
            reasonToReject: result.reasonToReject || "",
            categoryScores: finalCategoryScores, 
            advice: result.advice || ""
        };

    } catch (error) {
        console.error("Lỗi AI đánh giá CV chi tiết:", error);
        
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
                feedback: "Lỗi hệ thống hoặc quá tải API, vui lòng thử lại sau!"
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