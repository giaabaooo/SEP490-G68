const mongoose = require("mongoose");

const interviewHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Tham chiếu đến model User hiện tại
            required: true,
        },
        jobPosition: {
            type: String,
            required: true,
        },
        messages: [
            {
                role: { type: String, enum: ['user', 'model'] },
                content: { type: String }
            }
        ],
        reportData: {
            score: Number,
            overview: String,
            strengths: [String],
            weaknesses: [String],
            improvements: [String]
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("InterviewHistory", interviewHistorySchema);