const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');

// GET /api/applications
// Supports filtering by jobId, status, search (candidate name), pagination and sorting
exports.list = async (req, res) => {
  try {
    const {
      jobId,
      status,
      search,
      page = 1,
      limit = 20,
      sort = '-appliedAt',
    } = req.query;

    const user = req.user || {};

    const q = {};
    // If requester is a business (recruiter), restrict to their jobs only
    if (user.role === 'business') {
      // find job ids owned by this recruiter
      const jobs = await Job.find({ recruiterId: user.id }).select('_id');
      const jobIds = jobs.map((j) => j._id.toString());

      // If client requested a specific jobId, ensure it's owned by recruiter
      if (jobId) {
        if (!jobIds.includes(jobId.toString())) {
          return res.status(403).json({ message: 'Access denied to requested job applications' });
        }
        q.jobId = jobId;
      } else {
        q.jobId = { $in: jobIds };
      }
    } else {
      if (jobId) q.jobId = jobId;
    }
    if (status) q.status = status;

    // If search by candidate name, find matching users first
    if (search) {
      const users = await User.find({ fullName: new RegExp(search, 'i') }).select('_id');
      const ids = users.map((u) => u._id);
      // If no matching users, return empty result
      if (ids.length === 0) {
        return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
      }
      q.userId = { $in: ids };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Application.countDocuments(q);

    const items = await Application.find(q)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    return res.json({ data: items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('List applications error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findById(id)
      .populate('userId', 'fullName avatar cvUrl email')
      .populate('jobId', 'title description recruiterId');

    const user = req.user || {};

    // If recruiter, ensure the application belongs to one of their jobs
    if (user.role === 'business') {
      if (!app) return res.status(404).json({ message: 'Application not found' });
      const recruiterId = app.jobId?.recruiterId?.toString();
      if (recruiterId !== user.id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!app) return res.status(404).json({ message: 'Application not found' });

    return res.json(app);
  } catch (error) {
    console.error('Get application error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
