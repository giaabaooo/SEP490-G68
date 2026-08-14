// File: backend/utils/usageHelper.js
const User = require('../models/User');
const Job = require('../models/Job'); // Bổ sung import Model Job

// 1. DÀNH CHO CANDIDATE: Kiểm tra và trừ lượt dùng theo gói
exports.checkCandidateLimit = async (userId, feature) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.role !== 'candidate') return true;

    const now = new Date();
    const lastReset = new Date(user.subscription?.usage?.lastResetDate || now);
    
    if (now - lastReset > 30 * 24 * 60 * 60 * 1000) {
        user.subscription.usage.cvReviewCount = 0;
        user.subscription.usage.mockInterviewMinutes = 0;
        user.subscription.usage.roadmapCount = 0;
        user.subscription.usage.lastResetDate = now;
    }

    const isPro = user.subscription.plan === 'pro' && user.subscription.endDate > now;

    if (feature === 'cv_review') {
        const limit = isPro ? 50 : 2;
        if (user.subscription.usage.cvReviewCount >= limit) throw new Error('LIMIT_EXCEEDED');
        user.subscription.usage.cvReviewCount += 1;
    } 
    else if (feature === 'interview') {
        const limit = isPro ? 180 : 15;
        if (user.subscription.usage.mockInterviewMinutes >= limit) throw new Error('LIMIT_EXCEEDED');
        user.subscription.usage.mockInterviewMinutes += 1; 
    } 
    else if (feature === 'roadmap') {
        const limit = isPro ? 20 : 1;
        if (user.subscription.usage.roadmapCount >= limit) throw new Error('LIMIT_EXCEEDED');
        user.subscription.usage.roadmapCount += 1;
    }

    await user.save();
    return true;
};

// 2. DÀNH CHO BUSINESS: Kiểm tra và trừ Token từ ví chính (Dùng khi tạo Job)
exports.checkBusinessToken = async (userId, tokenCost) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    if (user.role === 'admin' || user.subRole === 'admin') return true; 
    
    if (user.businessCredits.balance < tokenCost) {
        throw new Error('INSUFFICIENT_TOKENS');
    }
    
    user.businessCredits.balance -= tokenCost;
    await user.save();

    return user.businessCredits.balance;
};

// 3. NEW: DÀNH CHO MODERATOR: Trừ Token vào "Hạn mức nội bộ" của Job
exports.checkJobQuotaToken = async (jobId, tokenCost) => {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');

    // Nếu Job không có field này, coi như bằng 0
    const currentQuota = job.aiTokensQuota || 0;

    if (currentQuota < tokenCost) {
        throw new Error('INSUFFICIENT_JOB_QUOTA'); // Báo lỗi để Frontend hiển thị "Hạn mức nội bộ đã hết"
    }

    job.aiTokensQuota -= tokenCost;
    await job.save();

    return job.aiTokensQuota;
};