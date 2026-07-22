const Job = require("../models/Job");
const User = require("../models/User");

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

const serializeJob = async (job) => {
  const recruiter = await User.findById(job.recruiterId)
    .select("fullName companyName companySize website city address avatar")
    .lean();

  return {
    _id: job._id,
    id: job._id.toString(),
    title: job.title,
    description: job.description || "",
    requirements: parseLines(job.requirements),
    location: job.location || recruiter?.address || recruiter?.city || "",
    type: job.type || "Full-time",
    experience: job.experience || "Không yêu cầu kinh nghiệm",
    salary: job.salary || "",
    tags: Array.isArray(job.tags) ? job.tags : parseStringArray(job.tags),
    benefits: Array.isArray(job.benefits) ? job.benefits : parseLines(job.benefits),
    status: job.status === "active" ? "Active" : job.status === "draft" ? "Draft" : "Closed",
    deadline: job.recruitmentDeadline ? job.recruitmentDeadline.toISOString() : null,
    postedAt: job.createdAt,
    recruiterId: job.recruiterId,
    company: recruiter?.companyName || recruiter?.fullName || "Công ty",
    companyName: recruiter?.companyName || recruiter?.fullName || "Công ty",
    companySize: recruiter?.companySize || "",
    website: recruiter?.website || "",
    companyLocation: recruiter?.address || recruiter?.city || job.location || "",
    companyLogo: recruiter?.avatar || "",
    requireTest: job.requireTest || false,
    moderatorEmail: job.moderatorEmail || "",
    testStatus: job.testStatus || null,
  };
};

exports.getJobs = async (req, res) => {
  try {
    const query = {};

    // 1. Phân quyền dữ liệu
    if (req.query.recruiterId) {
      query.recruiterId = req.query.recruiterId;
      query.status = "active"; // Chỉ cho bên ngoài xem active
    } else if (req.user?.id && req.user?.role === "business") {
      // NẾU LÀ BUSINESS: Lấy tất cả job của họ, KHÔNG LỌC status ở đây
      query.recruiterId = req.user.id;
    } else {
      query.status = "active";
    }

    const { location, type, experience, keyword } = req.query;

    if (keyword) {
      const keywordRegex = new RegExp(keyword, "i"); 
      const matchingRecruiters = await User.find({ companyName: keywordRegex }).select("_id");
      const recruiterIds = matchingRecruiters.map(r => r._id);
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { tags: { $in: [keywordRegex] } },
        { recruiterId: { $in: recruiterIds } }
      ];
    }
    if (location) query.location = { $regex: location, $options: "i" };
    if (type) query.type = { $in: type.split(",") };
    if (experience) query.experience = { $in: experience.split(",") };

    const jobs = await Job.find(query).sort({ createdAt: -1 }).lean();
    const formattedJobs = await Promise.all(jobs.map((job) => serializeJob(job)));
    res.json(formattedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });

    // FIX: Cho phép Recruiter (HR) HOẶC Moderator xem chi tiết dù Job đang bị Draft
    const isOwner = req.user?.id && String(req.user.id) === String(job.recruiterId);
    const isModerator = req.user?.subRole === 'moderator';

    if (job.status !== "active" && !isOwner && !isModerator) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng (Tin bị ẩn)" });
    }

    const formattedJob = await serializeJob(job);
    res.json(formattedJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const {
      title, description, requirements, salary, deadline, location, type, experience, tags, benefits,
      requireTest, moderatorEmail
    } = req.body;

    if (!title || !description || !requirements || !deadline) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const parsedDeadline = parseDeadline(deadline);
    if (!parsedDeadline) return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });

    const normalizedModEmail = moderatorEmail ? moderatorEmail.toLowerCase().trim() : "";
    const finalStatus = requireTest ? "draft" : "active";

    const job = await Job.create({
      recruiterId: req.user.id,
      title,
      description,
      requirements,
      location: location || "",
      type: type || "Full-time",
      experience: experience || "Không yêu cầu kinh nghiệm",
      salary: salary || "",
      tags: parseStringArray(tags),
      benefits: parseLines(benefits),
      recruitmentDeadline: parsedDeadline,
      status: finalStatus,
      requireTest: requireTest || false,
      moderatorEmail: normalizedModEmail,
      testStatus: requireTest ? "pending" : null
    });

    if (requireTest && normalizedModEmail) {
      await User.updateOne(
        { email: normalizedModEmail },
        { 
          $set: { role: "business", subRole: "moderator", status: "active" },
          $setOnInsert: { email: normalizedModEmail, isVerified: true, fullName: "Chuyên gia (SME)" } 
        },
        { upsert: true }
      );
    }

    const formattedJob = await serializeJob(job);
    res.status(201).json({ message: "Đăng tin tuyển dụng thành công", job: formattedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, requirements, salary, deadline, location, type, experience, tags, benefits, 
      status, requireTest, moderatorEmail
    } = req.body;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    
    if (String(job.recruiterId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tin này" });
    }

    let parsedDeadline = job.recruitmentDeadline;
    if (deadline) {
      parsedDeadline = parseDeadline(deadline);
      if (!parsedDeadline) return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
    }

    job.title = title || job.title;
    job.description = description || job.description;
    job.requirements = requirements || job.requirements;
    job.location = location || job.location;
    job.type = type || job.type;
    job.experience = experience || job.experience;
    job.salary = salary || job.salary;
    job.recruitmentDeadline = parsedDeadline;
    
    if (tags) job.tags = parseStringArray(tags);
    if (benefits) job.benefits = parseLines(benefits);

    if (requireTest !== undefined) job.requireTest = requireTest;
    if (moderatorEmail !== undefined) job.moderatorEmail = moderatorEmail.toLowerCase().trim();

    if (job.requireTest) {
      if (job.testStatus !== 'approved') {
        job.testStatus = 'pending';
        job.status = 'draft';
      }
      if (job.moderatorEmail) {
        await User.updateOne(
          { email: job.moderatorEmail },
          { 
            $set: { role: "business", subRole: "moderator", status: "active" },
            $setOnInsert: { email: job.moderatorEmail, isVerified: true, fullName: "Chuyên gia (SME)" } 
          },
          { upsert: true }
        );
      }
    } else {
      job.testStatus = null;
      job.moderatorEmail = "";
    }

    if (status && ["active", "draft", "closed"].includes(status)) {
      if (!(job.requireTest && job.testStatus === 'pending')) {
        job.status = status;
      }
    }

    await job.save();
    const formattedJob = await serializeJob(job);

    res.status(200).json({ message: "Cập nhật tin tuyển dụng thành công", job: formattedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getModeratorRequests = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const jobs = await Job.find({
      requireTest: true,
      moderatorEmail: currentUser.email
    })
    .populate("recruiterId", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

    const formattedRequests = jobs.map((job) => ({
      id: job._id,
      jobTitle: job.title,
      hrName: job.recruiterId?.fullName || job.recruiterId?.email || "Nhân sự công ty",
      deadline: job.recruitmentDeadline ? job.recruitmentDeadline.toISOString().split("T")[0] : "Không có",
      status: job.testStatus || "pending" 
    }));

    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};