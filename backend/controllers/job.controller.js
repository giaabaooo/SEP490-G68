const Job = require("../models/Job");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const { createNotification } = require("../utils/notificationHelper");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value));

const parseStringArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\n|,|;/).map((item) => item.trim()).filter(Boolean);
  return [];
};

const parseLines = (value) => {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  return [];
};

const parseDeadline = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

// ĐÃ SỬA: Hỗ trợ recruiterId đã được populate để tránh N+1 database query
const serializeJob = async (job) => {
  let recruiter = null;
  if (job.recruiterId && typeof job.recruiterId === 'object' && (job.recruiterId.companyName || job.recruiterId.fullName)) {
    recruiter = job.recruiterId;
  } else if (job.recruiterId) {
    recruiter = await User.findById(job.recruiterId).select("fullName companyName companySize website city address avatar").lean();
  }
  return {
    _id: job._id, id: job._id.toString(), title: job.title, description: job.description || "",
    requirements: parseLines(job.requirements), location: job.location || recruiter?.address || recruiter?.city || "",
    type: job.type || "Full-time", experience: job.experience || "Không yêu cầu kinh nghiệm",
    salary: job.salary || "", tags: Array.isArray(job.tags) ? job.tags : parseStringArray(job.tags),
    benefits: Array.isArray(job.benefits) ? job.benefits : parseLines(job.benefits),
    status: job.status === "active" ? "Active" : job.status === "ready" ? "Ready" : job.status === "pending" ? "Pending" : job.status === "draft" ? "Draft" : "Closed",
    deadline: job.recruitmentDeadline ? job.recruitmentDeadline.toISOString() : null,
    postedAt: job.createdAt, recruiterId: recruiter?._id || job.recruiterId,
    vacancies: job.vacancies || 1, // <<< SỬA Ở ĐÂY
    company: recruiter?.companyName || recruiter?.fullName || "Công ty", companyName: recruiter?.companyName || recruiter?.fullName || "Công ty",
    companySize: recruiter?.companySize || "", website: recruiter?.website || "",
    companyLocation: recruiter?.address || recruiter?.city || job.location || "", companyLogo: recruiter?.avatar || "",
    requireTest: job.requireTest || false, moderatorEmail: job.moderatorEmail || "", testStatus: job.testStatus || null,
    assessmentId: job.assessmentId || null,
    aiTokensQuota: typeof job.aiTokensQuota === 'number' ? job.aiTokensQuota : 0,
    requirementCategories: job.requirementCategories || [], useAiReview: job.useAiReview !== false,
  };
};

exports.getJobs = async (req, res) => {
  try {
    const now = new Date();
    await Job.updateMany(
      { recruitmentDeadline: { $lt: now }, status: { $in: ["active", "pending", "ready"] } },
      { $set: { status: "closed" } }
    );
    await Job.updateMany(
      {
        status: "pending",
        testStatus: "approved",
        $or: [
          { recruitmentDeadline: null },
          { recruitmentDeadline: { $gte: now } }
        ]
      },
      { $set: { status: "ready" } }
    );

    const query = {};
    if (req.query.recruiterId) {
      query.recruiterId = req.query.recruiterId; query.status = "active"; 
    } else if (req.user?.id && req.user?.role === "business") {
      query.recruiterId = req.user.id;
    } else { query.status = "active"; }

    const { location, type, experience, keyword } = req.query;
    const normalizedKeyword = String(keyword || "").trim();
    const normalizedLocation = String(location || "").trim();
    if (normalizedKeyword) {
      const escapedKeyword = escapeRegex(normalizedKeyword);
      const keywordRegex = new RegExp(escapedKeyword, "i");
      const matchingRecruiters = await User.find({ companyName: keywordRegex }).select("_id");
      const recruiterIds = matchingRecruiters.map(r => r._id);
      query.$or = [{ title: keywordRegex }, { tags: { $in: [keywordRegex] } }, { recruiterId: { $in: recruiterIds } }];
    }
    if (normalizedLocation) query.location = new RegExp(escapeRegex(normalizedLocation), "i");
    if (type) query.type = { $in: type.split(",") };
    if (experience) query.experience = { $in: experience.split(",") };

    const jobs = await Job.find(query)
      .populate('recruiterId', 'fullName companyName companySize website city address avatar')
      .sort({ createdAt: -1 })
      .lean();
    const formattedJobs = await Promise.all(jobs.map((job) => serializeJob(job)));

    // Sắp xếp các Job còn hạn lên đầu, Job hết hạn / đã đóng xếp sau
    const nowTimestamp = Date.now();
    const sortedJobs = formattedJobs.sort((a, b) => {
      const isExpiredA = (() => {
        if ((a.status || '').toLowerCase() === 'closed') return true;
        if (!a.deadline) return false;
        const d = new Date(a.deadline);
        if (isNaN(d.getTime())) return false;
        const dEnd = new Date(d);
        if (dEnd.getHours() === 0 && dEnd.getMinutes() === 0 && dEnd.getSeconds() === 0) {
          dEnd.setHours(23, 59, 59, 999);
        }
        return dEnd.getTime() < nowTimestamp;
      })();

      const isExpiredB = (() => {
        if ((b.status || '').toLowerCase() === 'closed') return true;
        if (!b.deadline) return false;
        const d = new Date(b.deadline);
        if (isNaN(d.getTime())) return false;
        const dEnd = new Date(d);
        if (dEnd.getHours() === 0 && dEnd.getMinutes() === 0 && dEnd.getSeconds() === 0) {
          dEnd.setHours(23, 59, 59, 999);
        }
        return dEnd.getTime() < nowTimestamp;
      })();

      if (!isExpiredA && isExpiredB) return -1;
      if (isExpiredA && !isExpiredB) return 1;
      return new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
    });

    res.json(sortedJobs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID công việc không hợp lệ" });
    }

    const job = await Job.findById(id).populate('recruiterId', 'fullName companyName companySize website city address avatar');
    if (!job) return res.status(404).json({ message: "Không tìm thấy công việc" });

    // Cập nhật trạng thái nếu quá hạn
    if (job.recruitmentDeadline && new Date(job.recruitmentDeadline).getTime() < new Date().getTime()) {
      if (["active", "pending", "ready"].includes(job.status)) {
        job.status = "closed";
        await job.save();
      }
    } else if (job.status === "pending" && job.testStatus === "approved") {
      job.status = "ready";
      await job.save();
    }

    const formattedJob = await serializeJob(job);
    res.json(formattedJob);
  } catch (error) {
    console.error("Get job by ID error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin tuyển dụng" });
  }
};

exports.createJob = async (req, res) => {
  try {
    const { 
      title, description, requirements, salary, deadline, location, type, 
      experience, tags, benefits, status, isDraft: isDraftReq, requireTest, moderatorEmail, requirementCategories, 
      useAiReview, vacancies, testQuestionsCount 
    } = req.body;
    
    const isDraft = status === 'draft' || isDraftReq === true;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề công việc" });
    }

    if (!isDraft) {
      if (!description?.trim() || !requirements?.trim() || !deadline) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin (*)" });
      }
    }

    const parsedDeadline = deadline ? parseDeadline(deadline) : null;
    if (!isDraft && !parsedDeadline) {
      return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
    }

    const safeDescription = description?.trim() || "Bản nháp đang soạn thảo...";
    const safeRequirements = requirements?.trim() || "- Đang cập nhật yêu cầu...";
    const safeDeadline = parsedDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const normalizedModEmail = moderatorEmail ? moderatorEmail.toLowerCase().trim() : "";
    const questionsCount = Number(testQuestionsCount) > 0 ? Number(testQuestionsCount) : 10;
    const requiredTokens = questionsCount * 5;

    let finalStatus = "active";
    let finalTestStatus = null;
    let aiTokensQuota = 0;

    if (isDraft) {
      // 1. KHI LƯU NHÁP:
      // - Luôn đặt status = "draft"
      // - testStatus = null (chưa gửi yêu cầu duyệt tới moderator)
      // - KHÔNG trừ Token trong ví HR
      // - KHÔNG gửi email/thông báo cho Moderator
      finalStatus = "draft";
      finalTestStatus = null;
      aiTokensQuota = 0;
    } else {
      // 2. KHI ĐĂNG JOB THẬT SỰ HOẶC GỬI YÊU CẦU TEST:
      if (requireTest) {
        finalStatus = "pending"; // Chờ moderator duyệt test trước khi active
        finalTestStatus = "pending";

        // Kiểm tra và trừ Token
        const businessUser = await User.findById(req.user.id);
        if ((businessUser.businessCredits?.balance || 0) < requiredTokens) {
          return res.status(402).json({ 
            message: `Số dư ví hiện tại không đủ ${requiredTokens} Token để cấp hạn mức bài Test (${questionsCount} câu hỏi). Vui lòng nạp thêm!` 
          });
        }
        businessUser.businessCredits.balance -= requiredTokens;
        await businessUser.save();
        aiTokensQuota = requiredTokens;
      } else {
        finalStatus = "active";
        finalTestStatus = null;
        aiTokensQuota = 0;
      }
    }

    const job = await Job.create({
      recruiterId: req.user.id,
      title: title.trim(),
      description: safeDescription,
      requirements: safeRequirements,
      location: location || "",
      type: type || "Full-time",
      experience: experience || "Không yêu cầu kinh nghiệm",
      salary: salary || "",
      tags: parseStringArray(tags),
      benefits: parseLines(benefits),
      recruitmentDeadline: safeDeadline,
      status: finalStatus,
      requireTest: requireTest || false,
      moderatorEmail: normalizedModEmail,
      testStatus: finalTestStatus,
      vacancies: vacancies || 1,
      aiTokensQuota: aiTokensQuota,
      testQuestionsCount: questionsCount,
      requirementCategories: requirementCategories || [],
      useAiReview: useAiReview !== false
    });

    // CHỈ GỬI EMAIL & THÔNG BÁO CHO MODERATOR NẾU KHÔNG PHẢI LÀ BẢN NHÁP VÀ CÓ YÊU CẦU TEST
    if (!isDraft && requireTest && normalizedModEmail) {
      (async () => {
        try {
          const modUser = await User.findOne({ email: normalizedModEmail });
          const recruiterUser = await User.findById(req.user.id).select("fullName companyName");
          const companyDisplayName = recruiterUser?.companyName || recruiterUser?.fullName || "Doanh nghiệp";

          const frontendUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, "");

          if (modUser) {
              if (modUser.role !== 'admin') {
                  modUser.role = "business"; modUser.subRole = "moderator"; await modUser.save();
              }

              await createNotification({
                userId: modUser._id,
                title: 'Yêu cầu tạo bài Test chuyên môn mới',
                message: `Bạn được phân công xây dựng bài test (${questionsCount} câu hỏi) cho vị trí "${job.title}" từ ${companyDisplayName}.`,
                type: 'moderator_request',
                link: '/moderator/requests'
              });

              await sendEmail(
                normalizedModEmail,
                `[Careerio] Yêu cầu tạo bài Test chuyên môn: ${job.title}`,
                `<div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
                  <h2 style="color:#059669;">Yêu cầu tạo bài Test chuyên môn mới</h2>
                  <p>Xin chào,</p>
                  <p>Nhà tuyển dụng <strong>${companyDisplayName}</strong> đã chỉ định bạn làm Chuyên gia kiểm duyệt và xây dựng bài test (${questionsCount} câu hỏi) cho vị trí: <strong>${job.title}</strong>.</p>
                  <p>Vui lòng đăng nhập hệ thống để xem chi tiết JD và tiến hành biên soạn bộ đề.</p>
                  <a href="${frontendUrl}/moderator/requests" style="display:inline-block;background:#059669;color:#fff;padding:10px 22px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:12px;">Xem yêu cầu tạo Test</a>
                </div>`
              );
          } else {
              const inviteToken = jwt.sign({ email: normalizedModEmail, role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET, { expiresIn: '7d' });
              await Otp.create({ email: normalizedModEmail, otp: 'INVITE', data: { purpose: 'moderator-invite', token: inviteToken } });
              const inviteLink = `${frontendUrl}/invite-accept?token=${inviteToken}`;
              
              await sendEmail(
                  normalizedModEmail, "Lời mời làm Chuyên gia kiểm duyệt (Moderator) - Careerio",
                  `<div style="font-family:Arial"><h2>Bạn nhận được lời mời làm Moderator</h2>
                  <p>Công ty tuyển dụng đã chỉ định bạn làm Chuyên gia kiểm duyệt bài Test (${questionsCount} câu hỏi) trên hệ thống.</p>
                  <p>Vui lòng click vào nút bên dưới để thiết lập mật khẩu và tạo tài khoản:</p>
                  <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">Chấp nhận lời mời</a>
                  <p style="margin-top:20px;font-size:12px;color:#666;">Link này có hiệu lực trong 7 ngày.</p></div>`
              );
          }
        } catch (modErr) {
          console.error("[createJob] Background moderator notification error:", modErr.message);
        }
      })();
    }

    try {
      await createNotification({
        userId: req.user.id,
        title: isDraft 
          ? `Đã lưu bản nháp: ${job.title}`
          : (requireTest ? `Đã gửi yêu cầu tạo bài test: ${job.title}` : `Đăng công việc thành công: ${job.title}`),
        message: isDraft
          ? `Bản nháp công việc "${job.title}" đã được lưu thành công. Bạn có thể quay lại chỉnh sửa và xuất bản bất kỳ lúc nào.`
          : (requireTest 
              ? `Công việc "${job.title}" đã được tạo. Đang chờ chuyên gia Moderator hoàn thiện đề kiểm tra năng lực (${questionsCount} câu hỏi) trước khi công khai.`
              : `Công việc "${job.title}" đã được đăng thành công và sẵn sàng tiếp nhận hồ sơ ứng viên.`),
        type: 'general',
        link: '/bussiness/post-job'
      });
    } catch (notifErr) {}

    const formattedJob = await serializeJob(job);
    res.status(201).json({ 
      message: isDraft ? "Đã lưu bản nháp thành công" : "Tạo công việc thành công", 
      job: formattedJob 
    });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, requirements, salary, deadline, location, type, 
      experience, tags, benefits, status, isDraft: isDraftReq, requireTest, moderatorEmail, 
      requirementCategories, useAiReview, vacancies, testQuestionsCount 
    } = req.body;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Không tìm thấy công việc" });
    if (String(job.recruiterId) !== String(req.user.id)) return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tin này" });

    const isDraft = status === 'draft' || isDraftReq === true;
    const questionsCount = Number(testQuestionsCount) > 0 ? Number(testQuestionsCount) : (job.testQuestionsCount || 10);
    const requiredTokens = questionsCount * 5;

    let parsedDeadline = job.recruitmentDeadline;
    if (deadline) {
      parsedDeadline = parseDeadline(deadline);
      if (!parsedDeadline) return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
    }

    job.title = title !== undefined ? title : job.title;
    job.description = description !== undefined ? description : job.description;
    job.requirements = requirements !== undefined ? requirements : job.requirements;
    job.location = location !== undefined ? location : job.location;
    job.type = type !== undefined ? type : job.type;
    job.experience = experience !== undefined ? experience : job.experience;
    job.salary = salary !== undefined ? salary : job.salary;
    job.recruitmentDeadline = parsedDeadline;
    if (tags !== undefined) job.tags = parseStringArray(tags);
    if (benefits !== undefined) job.benefits = parseLines(benefits);
    if (requirementCategories !== undefined) job.requirementCategories = requirementCategories;
    if (useAiReview !== undefined) job.useAiReview = useAiReview;
    if (vacancies !== undefined) job.vacancies = vacancies;
    if (testQuestionsCount !== undefined) job.testQuestionsCount = questionsCount;
    if (moderatorEmail !== undefined) job.moderatorEmail = moderatorEmail.toLowerCase().trim();

    // Không cho phép bật yêu cầu bài test Moderator nếu công việc đã từng được xuất bản (Active/Closed) mà không có bài test
    const isPreviouslyPublished = (job.status === 'active' || job.status === 'closed') || (job.postedAt && job.status !== 'draft');
    if (isPreviouslyPublished && !job.requireTest && requireTest === true) {
      return res.status(400).json({ 
        message: "Công việc đã được xuất bản trước đó, không thể yêu cầu thêm bài test từ Moderator" 
      });
    }

    const targetRequireTest = requireTest !== undefined ? requireTest : job.requireTest;
    job.requireTest = targetRequireTest;

    if (status === 'active' && parsedDeadline) {
      const deadlineEnd = new Date(parsedDeadline);
      if (deadlineEnd.getHours() === 0 && deadlineEnd.getMinutes() === 0 && deadlineEnd.getSeconds() === 0) {
        deadlineEnd.setHours(23, 59, 59, 999);
      }
      if (deadlineEnd.getTime() < Date.now()) {
        return res.status(400).json({ message: "Không thể mở lại công việc đã hết hạn tuyển dụng" });
      }
      if (targetRequireTest && job.testStatus !== 'approved') {
        return res.status(400).json({ message: "Bài test chưa được Moderator publish nên chưa thể mở tuyển" });
      }
    }

    if (!targetRequireTest) {
      job.testStatus = null;
      job.moderatorEmail = "";
      if (isDraft || status === 'draft') {
        job.status = 'draft';
      } else if (status) {
        job.status = status;
      } else if (job.status === 'draft' || job.status === 'pending') {
        job.status = 'active'; // Nếu chuyển từ draft/pending sang đăng job
      }
    } else {
      // CÓ YÊU CẦU TEST:
      if (isDraft || status === 'draft') {
        // Lưu nháp: giữ status = 'draft', testStatus = null (nếu chưa được duyệt)
        job.status = 'draft';
        if (job.testStatus !== 'approved') {
          job.testStatus = null;
        }
      } else if (status === 'closed') {
        // NGƯỜI DÙNG CHỦ ĐỘNG ĐÓNG TIN: Giữ nguyên closed, KHÔNG tự chuyển sang pending
        job.status = 'closed';
      } else {
        // KHÔNG PHẢI LƯU NHÁP VÀ KHÔNG PHẢI CLOSED -> Người dùng bấm "Lưu & Gửi Yêu CẦU Test" hoặc "Xuất bản":
        if (job.testStatus !== 'approved') {
          // Cần gửi yêu cầu tới moderator
          const needsTokens = (job.aiTokensQuota || 0) < requiredTokens;
          if (needsTokens) {
            const tokensToDeduct = requiredTokens - (job.aiTokensQuota || 0);
            const businessUser = await User.findById(req.user.id);
            if ((businessUser.businessCredits?.balance || 0) < tokensToDeduct) {
              return res.status(402).json({ 
                message: `Số dư ví không đủ ${tokensToDeduct} Token để kích hoạt bài Test (${questionsCount} câu hỏi). Vui lòng nạp thêm!` 
              });
            }
            businessUser.businessCredits.balance -= tokensToDeduct;
            await businessUser.save();
            job.aiTokensQuota = requiredTokens;
          }

          const wasPending = job.testStatus === 'pending';
          job.testStatus = 'pending';
          job.status = 'pending'; // Đang chờ SME duyệt test

          // Gửi thông báo/email cho moderator nếu chưa từng gửi hoặc moderator thay đổi
          if (job.moderatorEmail && !wasPending) {
            (async () => {
              try {
                const modUser = await User.findOne({ email: job.moderatorEmail });
                if (modUser) {
                  if (modUser.role !== 'admin') { modUser.role = "business"; modUser.subRole = "moderator"; await modUser.save(); }
                  await createNotification({
                    userId: modUser._id,
                    title: 'Yêu cầu tạo bài Test chuyên môn',
                    message: `Bạn được phân công xây dựng bài test (${questionsCount} câu hỏi) cho vị trí "${job.title}".`,
                    type: 'moderator_request',
                    link: '/moderator/requests'
                  });
                } else {
                  const inviteToken = jwt.sign({ email: job.moderatorEmail, role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET, { expiresIn: '7d' });
                  await Otp.create({ email: job.moderatorEmail, otp: 'INVITE', data: { purpose: 'moderator-invite', token: inviteToken } });
                  const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite-accept?token=${inviteToken}`;
                  await sendEmail(job.moderatorEmail, "Lời mời làm Chuyên gia kiểm duyệt (Moderator) - Careerio", `<div style="font-family:Arial"><h2>Bạn nhận được lời mời làm Moderator</h2><p>Công ty tuyển dụng đã chỉ định bạn làm Chuyên gia kiểm duyệt.</p><a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">Chấp nhận lời mời</a></div>`);
                }
              } catch (err) {
                console.error("[updateJob] Background moderator notification error:", err.message);
              }
            })();
          }
        } else {
          // Bài test đã approved, có thể active hoặc closed
          job.status = status || 'active';
        }
      }
    }

    if (status === 'closed') {
      job.status = 'closed';
      // THÔNG BÁO CHO MODERATOR NẾU TIN TUYỂN DỤNG ĐÓNG
      if (job.moderatorEmail) {
        try {
          const modUser = await User.findOne({ email: job.moderatorEmail });
          if (modUser) {
            await createNotification({
              userId: modUser._id,
              title: 'Công việc đã đóng tuyển dụng',
              message: `Vị trí "${job.title}" đã được nhà tuyển dụng đóng tuyển dụng.`,
              type: 'job_closed',
              link: '/moderator/requests'
            });
          }
        } catch (modCloseErr) {
          console.error("[updateJob] Moderator close notification error:", modCloseErr.message);
        }
      }
    }

    await job.save();

    // Thông báo cho nhà tuyển dụng khi cập nhật thành công
    try {
      await createNotification({
        userId: req.user.id,
        title: isDraft ? `Đã lưu bản nháp: ${job.title}` : (job.status === 'closed' ? `Đã đóng công việc: ${job.title}` : `Đã cập nhật công việc: ${job.title}`),
        message: isDraft 
          ? `Bản nháp công việc "${job.title}" đã được cập nhật.` 
          : (job.status === 'closed' 
              ? `Công việc "${job.title}" đã được đóng tuyển dụng.` 
              : `Thông tin công việc "${job.title}" đã được cập nhật thành công.`),
        type: 'general',
        link: '/bussiness/post-job'
      });
    } catch (nErr) {}

    const formattedJob = await serializeJob(job);
    res.status(200).json({ 
      message: isDraft ? "Đã lưu bản nháp thành công" : "Cập nhật công việc thành công", 
      job: formattedJob 
    });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
};

exports.getModeratorRequests = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const normalizedEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : "";
    const jobs = await Job.find({ 
      requireTest: true, 
      testStatus: { $in: ["pending", "approved"] },
      moderatorEmail: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    })
      .populate("recruiterId", "fullName email companyName")
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const formattedRequests = jobs.map((job) => {
      const deadlineDate = job.recruitmentDeadline || job.deadline;
      let isExpired = false;
      let deadlineFormatted = "Không giới hạn";

      if (deadlineDate) {
        const d = new Date(deadlineDate);
        if (!isNaN(d.getTime())) {
          deadlineFormatted = d.toISOString().split("T")[0];
          const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          isExpired = checkDate < today;
        }
      }

      return {
        id: job._id,
        jobTitle: job.title,
        salary: job.salary || "Thỏa thuận",
        location: job.location || "Toàn quốc",
        type: job.type || "Toàn thời gian",
        jobStatus: job.status,
        assessmentId: job.assessmentId,
        companyName: job.recruiterId?.companyName || "Doanh nghiệp",
        hrName: job.recruiterId?.fullName || job.recruiterId?.email || "Nhân sự công ty",
        hrEmail: job.recruiterId?.email || "",
        deadline: deadlineFormatted,
        isExpired,
        status: job.testStatus || "pending" 
      };
    });
    res.json(formattedRequests);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
