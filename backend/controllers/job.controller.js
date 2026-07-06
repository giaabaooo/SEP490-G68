const Job = require("../models/Job");

exports.getJobs = async (req, res) => {
  try {
    const query = {};

    if (req.user?.id) {
      query.recruiterId = req.user.id;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const formattedJobs = jobs.map((job) => ({
      ...job,
      deadline: job.recruitmentDeadline,
      status: job.status === "active" ? "Active" : job.status === "draft" ? "Draft" : "Closed",
    }));

    res.json(formattedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const { title, description, requirements, salary, deadline } = req.body;

    if (!title || !description || !requirements || !deadline) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const job = await Job.create({
      recruiterId: req.user.id,
      title,
      description,
      requirements,
      salary: salary || "",
      recruitmentDeadline: new Date(deadline),
      status: "active",
    });

    res.status(201).json({
      message: "Đăng tin tuyển dụng thành công",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
