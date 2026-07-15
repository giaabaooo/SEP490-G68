const express = require('express');
const router = express.Router();
const multer = require('multer');
const PDFParser = require("pdf2json");

const auth = require('../middleware/auth');
const { saveCV, getMyCVs } = require('../controllers/cvController');
const aiService = require('../services/ai.service');

// Cấu hình Multer lưu file tạm trong RAM
const upload = multer({ storage: multer.memoryStorage() });

router.post('/save', auth, saveCV);
router.get('/my-cvs', auth, getMyCVs);

// Hàm trích xuất chữ an toàn từ file PDF
const extractTextFromPDF = (buffer) => {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(this, 1); // 1: Lấy Text
        
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
            const rawText = pdfParser.getRawTextContent();
            let decodedText = rawText;
            
            // Xử lý an toàn: Bắt lỗi "URI malformed" không làm chết Server
            try {
                decodedText = decodeURIComponent(rawText);
            } catch (e) {
                try {
                    // Nếu lỗi do dấu % đứng một mình trong PDF, chuyển nó thành %25 rồi decode
                    const sanitizedText = rawText.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
                    decodedText = decodeURIComponent(sanitizedText);
                } catch (err) {
                    // Fallback cuối cùng: Trả về chữ nguyên gốc
                    decodedText = rawText; 
                }
            }
            
            resolve(decodedText);
        });
        
        pdfParser.parseBuffer(buffer);
    });
};

router.post('/parse-pdf', auth, upload.single('cvFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Vui lòng upload file PDF" });
        
        // 1. Lấy Text an toàn
        const extractedText = await extractTextFromPDF(req.file.buffer);
        
        // 2. Gửi Text qua AI bóc tách
        const parsedData = await aiService.parseCVForTemplate(extractedText);
        
        res.json({ success: true, parsedData });
    } catch (error) {
        console.error("Lỗi phân tích PDF:", error);
        res.status(500).json({ message: "Lỗi xử lý file PDF: " + (error.message || "Unknown error") });
    }
});

module.exports = router;