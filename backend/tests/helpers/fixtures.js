const { Types } = require('mongoose');

const oid = () => new Types.ObjectId().toString();

function freeCandidate(overrides = {}) {
  return {
    _id: oid(),
    role: 'candidate',
    subRole: '',
    status: 'active',
    fullName: 'Nguyen Van A',
    email: 'candidate@test.com',
    skills: ['JavaScript'],
    subscription: {
      plan: 'free',
      startDate: null,
      endDate: null,
      usage: { cvReviewCount: 0, mockInterviewMinutes: 0, roadmapCount: 0, lastResetDate: new Date() }
    },
    businessCredits: { balance: 0 },
    save: jest.fn(),
    ...overrides
  };
}

function proCandidate(overrides = {}) {
  const now = new Date();
  const future = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  return freeCandidate({
    subscription: {
      plan: 'pro',
      startDate: now,
      endDate: future,
      usage: { cvReviewCount: 0, mockInterviewMinutes: 0, roadmapCount: 0, lastResetDate: now }
    },
    ...overrides
  });
}

function businessUser(overrides = {}) {
  return {
    _id: oid(),
    role: 'business',
    subRole: 'hr',
    status: 'active',
    fullName: 'HR Nguyen',
    email: 'hr@test.com',
    companyName: 'Acme Corp',
    businessCredits: { balance: 500 },
    subscription: { plan: 'free', usage: {} },
    save: jest.fn(),
    ...overrides
  };
}

function adminUser(overrides = {}) {
  return {
    _id: oid(),
    role: 'admin',
    subRole: 'admin',
    status: 'active',
    fullName: 'Admin',
    email: 'admin@test.com',
    save: jest.fn(),
    ...overrides
  };
}

function job(overrides = {}) {
  return {
    _id: oid(),
    recruiterId: oid(),
    title: 'Backend Developer',
    description: 'Xay dung API voi Node.js',
    requirements: ['Node.js', 'MongoDB'],
    location: 'Ha Noi',
    type: 'Full-time',
    experience: '1-2 nam',
    salary: '15-20 trieu',
    tags: ['nodejs'],
    benefits: [],
    status: 'active',
    requireTest: false,
    moderatorEmail: '',
    testStatus: null,
    vacancies: 1,
    aiTokensQuota: 0,
    requirementCategories: [],
    useAiReview: true,
    recruitmentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    save: jest.fn(),
    ...overrides
  };
}

function application(overrides = {}) {
  return {
    _id: oid(),
    jobId: oid(),
    userId: oid(),
    status: 'Applied',
    applyCount: 1,
    testStatus: 'Pending',
    aiScore: 0,
    aiMatchDetails: {},
    save: jest.fn(),
    toObject: function () { return { ...this }; },
    ...overrides
  };
}

function assessment(overrides = {}) {
  return {
    _id: oid(),
    jobId: oid(),
    createdBy: oid(),
    assessmentName: 'Node.js Test',
    status: 'PUBLISHED',
    isPublic: false,
    questions: [
      { question: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
      { question: 'Q2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
      { question: 'Q3', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
      { question: 'Q4', options: ['A', 'B', 'C', 'D'], correctAnswer: 3 },
      { question: 'Q5', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }
    ],
    save: jest.fn(),
    toObject: function () { return { ...this }; },
    ...overrides
  };
}

module.exports = { oid, freeCandidate, proCandidate, businessUser, adminUser, job, application, assessment };
