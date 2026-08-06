const mongoose = require("mongoose");

const interviewTemplateSchema = new mongoose.Schema(
    {
        jobPosition: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // Lưu chữ thường để dễ query trùng lặp
        },
        questions: {
            type: [String],
            required: true,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("InterviewTemplate", interviewTemplateSchema);