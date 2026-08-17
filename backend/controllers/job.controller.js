const Job = require("../models/Job");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");

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

// ĐÃ SỬA: Thêm `vacancies` vào hàm serializeJob để trả về frontend
const serializeJob = async (job) => {
  const recruiter = await User.findById(job.recruiterId).select("fullName companyName companySize website city address avatar").lean();
  return {
    _id: job._id, id: job._id.toString(), title: job.title, description: job.description || "",
    requirements: parseLines(job.requirements), location: job.location || recruiter?.address || recruiter?.city || "",
    type: job.type || "Full-time", experience: job.experience || "Không yêu cầu kinh nghiệm",
    salary: job.salary || "", tags: Array.isArray(job.tags) ? job.tags : parseStringArray(job.tags),
    benefits: Array.isArray(job.benefits) ? job.benefits : parseLines(job.benefits),
    status: job.status === "active" ? "Active" : job.status === "draft" ? "Draft" : "Closed",
    deadline: job.recruitmentDeadline ? job.recruitmentDeadline.toISOString() : null,
    postedAt: job.createdAt, recruiterId: job.recruiterId,
    vacancies: job.vacancies || 1, // <<< SỬA Ở ĐÂY
    company: recruiter?.companyName || recruiter?.fullName || "Công ty", companyName: recruiter?.companyName || recruiter?.fullName || "Công ty",
    companySize: recruiter?.companySize || "", website: recruiter?.website || "",
    companyLocation: recruiter?.address || recruiter?.city || job.location || "", companyLogo: recruiter?.avatar || "",
    requireTest: job.requireTest || false, moderatorEmail: job.moderatorEmail || "", testStatus: job.testStatus || null,
    requirementCategories: job.requirementCategories || [], useAiReview: job.useAiReview !== false,
  };
};

exports.getJobs = async (req, res) => {
  try {
    const query = {};
    if (req.query.recruiterId) {
      query.recruiterId = req.query.recruiterId; query.status = "active"; 
    } else if (req.user?.id && req.user?.role === "business") {
      query.recruiterId = req.user.id;
    } else { query.status = "active"; }

    const { location, type, experience, keyword } = req.query;
    if (keyword) {
      const keywordRegex = new RegExp(keyword, "i"); 
      const matchingRecruiters = await User.find({ companyName: keywordRegex }).select("_id");
      const recruiterIds = matchingRecruiters.map(r => r._id);
      query.$or = [{ title: { $regex: keyword, $options: "i" } }, { tags: { $in: [keywordRegex] } }, { recruiterId: { $in: recruiterIds } }];
    }
    if (location) query.location = { $regex: location, $options: "i" };
    if (type) query.type = { $in: type.split(",") };
    if (experience) query.experience = { $in: experience.split(",") };

    const jobs = await Job.find(query).sort({ createdAt: -1 }).lean();
    const formattedJobs = await Promise.all(jobs.map((job) => serializeJob(job)));
    res.json(formattedJobs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });

    const isOwner = req.user?.id && String(req.user.id) === String(job.recruiterId);
    const isModerator = req.user?.subRole === 'moderator';

    if (job.status !== "active" && !isOwner && !isModerator) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng (Tin bị ẩn)" });
    }

    const formattedJob = await serializeJob(job);
    res.json(formattedJob);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createJob = async (req, res) => {
  try {
    const { title, description, requirements, salary, deadline, location, type, experience, tags, benefits, requireTest, moderatorEmail, requirementCategories, useAiReview, vacancies } = req.body;
    if (!title || !description || !requirements || !deadline) return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });

    const parsedDeadline = parseDeadline(deadline);
    if (!parsedDeadline) return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });

    const normalizedModEmail = moderatorEmail ? moderatorEmail.toLowerCase().trim() : "";
    const finalStatus = requireTest ? "draft" : "active";
    let aiTokensQuota = 0;

    // 1. TRỪ TOKEN TẠO BÀI TEST NGAY (Do Create là bước Atomic với Database)
    if (requireTest) {
      const businessUser = await User.findById(req.user.id);
      if ((businessUser.businessCredits?.balance || 0) < 200) {
        return res.status(402).json({ message: "Số dư không đủ 200 Token để tạo bài Test. Vui lòng nạp thêm!" });
      }
      businessUser.businessCredits.balance -= 200;
      await businessUser.save();
      aiTokensQuota = 200; 
    }

    const job = await Job.create({
      recruiterId: req.user.id, title, description, requirements, location: location || "",
      type: type || "Full-time", experience: experience || "Không yêu cầu kinh nghiệm",
      salary: salary || "", tags: parseStringArray(tags), benefits: parseLines(benefits),
      recruitmentDeadline: parsedDeadline, status: finalStatus, requireTest: requireTest || false,
      moderatorEmail: normalizedModEmail, testStatus: requireTest ? "pending" : null,
      vacancies: vacancies || 1, // <<< ĐẢM BẢO LƯU VACANCIES
      aiTokensQuota: aiTokensQuota, requirementCategories: requirementCategories || [], useAiReview: useAiReview !== false
    });

    // 2. FIX LỖI MODERATOR (GỬI EMAIL THAY VÌ TẠO TRẮNG USER)
    if (requireTest && normalizedModEmail) {
      const modUser = await User.findOne({ email: normalizedModEmail });
      if (modUser) {
          // Bỏ qua nếu họ đang là Admin
          if (modUser.role !== 'admin') {
              modUser.role = "business"; modUser.subRole = "moderator"; await modUser.save();
          }
      } else {
          // Tạo Token cho Email Mời
          const inviteToken = jwt.sign({ email: normalizedModEmail, role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET, { expiresIn: '7d' });
          await Otp.create({ email: normalizedModEmail, otp: 'INVITE', data: { purpose: 'moderator-invite', token: inviteToken } });
          const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite-accept?token=${inviteToken}`;
          
          await sendEmail(
              normalizedModEmail, "Lời mời làm Chuyên gia kiểm duyệt (Moderator) - Careerio",
              `<div style="font-family:Arial"><h2>Bạn nhận được lời mời làm Moderator</h2>
              <p>Công ty tuyển dụng đã chỉ định bạn làm Chuyên gia kiểm duyệt bài Test trên hệ thống.</p>
              <p>Vui lòng click vào nút bên dưới để thiết lập mật khẩu và tạo tài khoản:</p>
              <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">Chấp nhận lời mời</a>
              <p style="margin-top:20px;font-size:12px;color:#666;">Link này có hiệu lực trong 7 ngày.</p></div>`
          );
      }
    }

    const formattedJob = await serializeJob(job);
    res.status(201).json({ message: "Đăng tin tuyển dụng thành công", job: formattedJob });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, salary, deadline, location, type, experience, tags, benefits, status, requireTest, moderatorEmail, requirementCategories, useAiReview, vacancies } = req.body;
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    if (String(job.recruiterId) !== String(req.user.id)) return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tin này" });

    // CHECK VÀ TRỪ TIỀN NẾU ĐỔI TỪ KHÔNG TEST SANG CÓ TEST
    if (requireTest === true && !job.requireTest) {
        const businessUser = await User.findById(req.user.id);
        if ((businessUser.businessCredits?.balance || 0) < 200) {
            return res.status(402).json({ message: "Không đủ 200 Token để kích hoạt bài Test. Vui lòng nạp thêm!" });
        }
        businessUser.businessCredits.balance -= 200;
        await businessUser.save();
        job.aiTokensQuota = (job.aiTokensQuota || 0) + 200;
    }

    let parsedDeadline = job.recruitmentDeadline;
    if (deadline) {
      parsedDeadline = parseDeadline(deadline);
      if (!parsedDeadline) return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
    }

    job.title = title || job.title; job.description = description || job.description; job.requirements = requirements || job.requirements; 
    job.location = location || job.location; job.type = type || job.type; job.experience = experience || job.experience;
    job.salary = salary || job.salary; job.recruitmentDeadline = parsedDeadline;
    if (tags) job.tags = parseStringArray(tags); if (benefits) job.benefits = parseLines(benefits);
    if (requirementCategories) job.requirementCategories = requirementCategories; if (useAiReview !== undefined) job.useAiReview = useAiReview;
    if (requireTest !== undefined) job.requireTest = requireTest;
    if (vacancies !== undefined) job.vacancies = vacancies; // <<< ĐẢM BẢO LƯU VACANCIES CẬP NHẬT
    if (moderatorEmail !== undefined) job.moderatorEmail = moderatorEmail.toLowerCase().trim();

    if (job.requireTest) {
      if (job.testStatus !== 'approved') { job.testStatus = 'pending'; job.status = 'draft'; }
      if (job.moderatorEmail) {
          const modUser = await User.findOne({ email: job.moderatorEmail });
          if (modUser) {
              if (modUser.role !== 'admin') { modUser.role = "business"; modUser.subRole = "moderator"; await modUser.save(); }
          } else {
              const inviteToken = jwt.sign({ email: job.moderatorEmail, role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET, { expiresIn: '7d' });
              await Otp.create({ email: job.moderatorEmail, otp: 'INVITE', data: { purpose: 'moderator-invite', token: inviteToken } });
              const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite-accept?token=${inviteToken}`;
              await sendEmail(job.moderatorEmail, "Lời mời làm Chuyên gia kiểm duyệt (Moderator) - Careerio", `<div style="font-family:Arial"><h2>Bạn nhận được lời mời làm Moderator</h2><p>Công ty tuyển dụng đã chỉ định bạn làm Chuyên gia kiểm duyệt.</p><a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">Chấp nhận lời mời</a></div>`);
          }
      }
    } else {
      job.testStatus = null; job.moderatorEmail = "";
    }

    if (status && ["active", "draft", "closed"].includes(status)) {
      if (!(job.requireTest && job.testStatus === 'pending')) job.status = status;
    }

    await job.save();
    const formattedJob = await serializeJob(job);
    res.status(200).json({ message: "Cập nhật tin tuyển dụng thành công", job: formattedJob });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getModeratorRequests = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const jobs = await Job.find({ requireTest: true, moderatorEmail: currentUser.email }).populate("recruiterId", "fullName email").sort({ createdAt: -1 }).lean();
    const formattedRequests = jobs.map((job) => ({
      id: job._id, jobTitle: job.title, hrName: job.recruiterId?.fullName || job.recruiterId?.email || "Nhân sự công ty",
      deadline: job.recruitmentDeadline ? job.recruitmentDeadline.toISOString().split("T")[0] : "Không có", status: job.testStatus || "pending" 
    }));
    res.json(formattedRequests);
  } catch (error) { res.status(500).json({ message: error.message }); }
};