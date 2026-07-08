const Job = require("../models/Job");
const User = require("../models/User");

const parseStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseLines = (value) => {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseDeadline = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

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
  };
};

exports.getJobs = async (req, res) => {
  try {
    const query = {};

    if (req.query.recruiterId) {
      query.recruiterId = req.query.recruiterId;
    } else if (req.user?.id && req.user?.role === "business") {
      query.recruiterId = req.user.id;
    } else if (!req.user?.id) {
      query.status = "active";
    } else {
      query.status = "active";
    }

    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: "i" };
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const formattedJobs = await Promise.all(jobs.map((job) => serializeJob(job)));

    res.json(formattedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
    }

    if (job.status !== "active" && (!req.user?.id || req.user.id !== job.recruiterId.toString())) {
      return res.status(404).json({ message: "Không tìm thấy tin tuyển dụng" });
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
      title,
      description,
      requirements,
      salary,
      deadline,
      location,
      type,
      experience,
      tags,
      benefits,
    } = req.body;

    if (!title || !description || !requirements || !deadline) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const parsedDeadline = parseDeadline(deadline);
    if (!parsedDeadline) {
      return res.status(400).json({ message: "Ngày hết hạn không hợp lệ" });
    }

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
      status: "active",
    });

    const formattedJob = await serializeJob(job);

    res.status(201).json({
      message: "Đăng tin tuyển dụng thành công",
      job: formattedJob,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
