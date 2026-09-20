jest.mock('../../../models/Assessment');
jest.mock('../../../models/Job');
jest.mock('../../../models/User');
jest.mock('../../../models/Application');
jest.mock('../../../utils/notificationHelper');
jest.mock('../../../services/ai.service');

const Assessment = require('../../../models/Assessment');
const Job = require('../../../models/Job');
const User = require('../../../models/User');
const Application = require('../../../models/Application');
const aiService = require('../../../services/ai.service');
const { createNotification } = require('../../../utils/notificationHelper');
const assessmentController = require('../../../controllers/assessment.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { assessment, job, application, oid } = require('../../helpers/fixtures');

beforeEach(() => {
  createNotification.mockResolvedValue({});
});

describe('assessment.controller.generateAI', () => {
  test('UTC001 - thieu topic -> 400', async () => {
    const { req, res } = mockReqRes({ body: { jobId: 'j1' } });
    await assessmentController.generateAI(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC002 - thieu jobId -> 400', async () => {
    const { req, res } = mockReqRes({ body: { topic: 'Node.js' } });
    await assessmentController.generateAI(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC003 - job khong ton tai -> 404', async () => {
    Job.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: { topic: 'Node.js', jobId: 'j1' } });
    await assessmentController.generateAI(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC004 - job khong du 50 token noi bo -> 402, khong goi AI', async () => {
    Job.findById.mockResolvedValue(job({ aiTokensQuota: 10 }));
    const { req, res } = mockReqRes({ body: { topic: 'Node.js', jobId: 'j1' } });
    await assessmentController.generateAI(req, res);
    expect(res.statusCode).toBe(402);
    expect(aiService.generateWithFallback).not.toHaveBeenCalled();
  });

  test('UTC005 - AI thanh cong -> tru 50 token, tra ve danh sach cau hoi', async () => {
    const currentJob = job({ aiTokensQuota: 200 });
    Job.findById.mockResolvedValue(currentJob);
    aiService.generateWithFallback.mockResolvedValue([
      { question: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 }
    ]);

    const { req, res } = mockReqRes({ body: { topic: 'Node.js', jobId: 'j1' } });
    await assessmentController.generateAI(req, res);

    expect(currentJob.aiTokensQuota).toBe(150);
    expect(currentJob.save).toHaveBeenCalledTimes(1);
    expect(res._getJSONData().questions).toHaveLength(1);
    expect(res.statusCode).toBe(200);
  });

  test('UTC006 - AI tra ve option khong du 4 hoac correctAnswer khong phai so nguyen -> dung fallback mac dinh', async () => {
    Job.findById.mockResolvedValue(job({ aiTokensQuota: 200 }));
    aiService.generateWithFallback.mockResolvedValue([
      { question: 'Q1', options: ['A', 'B'], correctAnswer: 'x' }
    ]);

    const { req, res } = mockReqRes({ body: { topic: 'Node.js', jobId: 'j1' } });
    await assessmentController.generateAI(req, res);

    const q = res._getJSONData().questions[0];
    expect(q.options).toEqual(['A', 'B', 'C', 'D']);
    expect(q.correctAnswer).toBe(0);
  });
});

describe('assessment.controller.createAssessment', () => {
  test('UTC007 - tao test PUBLISHED gan voi job -> job.testStatus=approved, status=active, gui notif', async () => {
    const savedTest = assessment({ status: 'PUBLISHED' });
    Assessment.mockImplementation(() => savedTest);
    savedTest.save = jest.fn().mockResolvedValue(savedTest);
    Job.findByIdAndUpdate.mockResolvedValue(job({ recruiterId: oid() }));

    const { req, res } = mockReqRes({ user: { id: 'mod1' }, body: { assessmentName: 'T', jobId: 'j1', status: 'PUBLISHED', questions: [] } });
    await assessmentController.createAssessment(req, res);

    expect(Job.findByIdAndUpdate).toHaveBeenCalledWith('j1', expect.objectContaining({ testStatus: 'approved', status: 'active' }), expect.any(Object));
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('UTC008 - tao test DRAFT gan voi job -> job.testStatus=pending, khong doi status active', async () => {
    const savedTest = assessment({ status: 'DRAFT' });
    Assessment.mockImplementation(() => savedTest);
    savedTest.save = jest.fn().mockResolvedValue(savedTest);
    Job.findByIdAndUpdate.mockResolvedValue(job({ recruiterId: oid() }));

    const { req, res } = mockReqRes({ user: { id: 'mod1' }, body: { assessmentName: 'T', jobId: 'j1', status: 'DRAFT', questions: [] } });
    await assessmentController.createAssessment(req, res);

    expect(Job.findByIdAndUpdate).toHaveBeenCalledWith('j1', expect.objectContaining({ testStatus: 'pending' }), expect.any(Object));
  });
});

describe('assessment.controller.updateAssessment', () => {
  test('UTC009 - test khong ton tai hoac khong phai chu -> 404', async () => {
    Assessment.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'mod1' }, params: { id: 'a1' }, body: {} });
    await assessmentController.updateAssessment(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC010 - chuyen tu DRAFT sang PUBLISHED -> kich hoat job va bao Job da duoc duyet', async () => {
    const test = assessment({ status: 'DRAFT', jobId: 'j1' });
    test.save = jest.fn().mockResolvedValue(test);
    Assessment.findOne.mockResolvedValue(test);
    Job.findByIdAndUpdate.mockResolvedValue(job({ recruiterId: oid() }));

    const { req, res } = mockReqRes({ user: { id: 'mod1' }, params: { id: 'a1' }, body: { status: 'PUBLISHED' } });
    await assessmentController.updateAssessment(req, res);

    expect(test.status).toBe('PUBLISHED');
    expect(Job.findByIdAndUpdate).toHaveBeenCalledWith('j1', expect.objectContaining({ testStatus: 'approved', status: 'active' }), expect.any(Object));
    expect(res.statusCode).toBe(200);
  });
});

describe('assessment.controller.getTestForCandidate', () => {
  test('UTC011 - test khong ton tai -> 404', async () => {
    Assessment.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 'a1' } });
    await assessmentController.getTestForCandidate(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC012 - tra ve de thi nhung xoa het correctAnswer khoi tung cau hoi', async () => {
    Assessment.findById.mockReturnValue(mockQuery(assessment()));
    const { req, res } = mockReqRes({ params: { id: 'a1' } });
    await assessmentController.getTestForCandidate(req, res);

    const data = res._getJSONData();
    expect(data.questions.every(q => q.correctAnswer === undefined)).toBe(true);
  });
});

describe('assessment.controller.submitTest', () => {
  test('UTC013 - test khong ton tai -> 404', async () => {
    Assessment.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {} } });
    await assessmentController.submitTest(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC014 - chua nop CV ung tuyen -> 400', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    Application.findOne.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {} } });
    await assessmentController.submitTest(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/chưa nộp CV/);
  });

  test('UTC015 - da hoan thanh bai test roi -> 400', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    Application.findOne.mockReturnValue(mockQuery(application({ testStatus: 'Completed' })));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {} } });
    await assessmentController.submitTest(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/đã hoàn thành/);
  });

  test('UTC016 - tra loi dung toan bo 5/5 -> score=100', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    const app = application({ testStatus: 'Pending' });
    Application.findOne.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValue(mockQuery(application({ jobId: { title: 'X' } })));
    User.findById.mockReturnValue(mockQuery({ fullName: 'A' }));

    const { req, res } = mockReqRes({
      user: { id: 'u1' }, params: { id: 'a1' },
      body: { answers: { '0': 0, '1': 1, '2': 2, '3': 3, '4': 0 }, duration: 100 }
    });
    await assessmentController.submitTest(req, res);

    expect(res._getJSONData().score).toBe(100);
    expect(app.testStatus).toBe('Completed');
    expect(app.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('UTC017 - dung 3/5 cau -> score=60 (lam tron)', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    const app = application({ testStatus: 'Pending' });
    Application.findOne.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValue(mockQuery(application({ jobId: { title: 'X' } })));
    User.findById.mockReturnValue(mockQuery({ fullName: 'A' }));

    const { req, res } = mockReqRes({
      user: { id: 'u1' }, params: { id: 'a1' },
      body: { answers: { '0': 0, '1': 1, '2': 2, '3': 9, '4': 9 }, duration: 100 }
    });
    await assessmentController.submitTest(req, res);

    expect(res._getJSONData().score).toBe(60);
    expect(res._getJSONData().correctCount).toBe(3);
  });

  test('UTC018 - answers rong -> score=0, khong throw', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    const app = application({ testStatus: 'Pending' });
    Application.findOne.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValue(mockQuery(application({ jobId: { title: 'X' } })));
    User.findById.mockReturnValue(mockQuery({ fullName: 'A' }));

    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {} } });
    await assessmentController.submitTest(req, res);

    expect(res._getJSONData().score).toBe(0);
    expect(res.statusCode).toBe(200);
  });

  test('UTC019 - tabSwitches la chuoi so "4" -> ep kieu ve number 4', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    const app = application({ testStatus: 'Pending' });
    Application.findOne.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValue(mockQuery(application({ jobId: { title: 'X' } })));
    User.findById.mockReturnValue(mockQuery({ fullName: 'A' }));

    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {}, tabSwitches: '4' } });
    await assessmentController.submitTest(req, res);

    expect(app.tabSwitches).toBe(4);
  });

  test('UTC020 - tabSwitches undefined -> luu ve 0', async () => {
    Assessment.findById.mockResolvedValue(assessment());
    const app = application({ testStatus: 'Pending' });
    Application.findOne.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValue(mockQuery(application({ jobId: { title: 'X' } })));
    User.findById.mockReturnValue(mockQuery({ fullName: 'A' }));

    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {} } });
    await assessmentController.submitTest(req, res);

    expect(app.tabSwitches).toBe(0);
  });

  test('UTC021 - questions rong (total=0) -> score la NaN, JSON tra ve null cho client (BUG, xem plan muc 9)', async () => {
    Assessment.findById.mockResolvedValue(assessment({ questions: [] }));
    const app = application({ testStatus: 'Pending' });
    Application.findOne.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValue(mockQuery(application({ jobId: { title: 'X' } })));
    User.findById.mockReturnValue(mockQuery({ fullName: 'A' }));

    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'a1' }, body: { answers: {} } });
    await assessmentController.submitTest(req, res);

    // NaN khong the bieu dien trong JSON -> JSON.stringify chuyen no thanh null.
    // Client nhan duoc testScore = null thay vi mot con so, day la trieu chung cua loi chia cho 0.
    expect(res._getJSONData().score).toBeNull();
  });
});

describe('assessment.controller.getPublicTests', () => {
  test('UTC022 - tra ve danh sach test cong khai da PUBLISHED', async () => {
    Assessment.find.mockReturnValue(mockQuery([assessment({ isPublic: true })]));
    const { req, res } = mockReqRes();
    await assessmentController.getPublicTests(req, res);
    expect(Assessment.find).toHaveBeenCalledWith({ isPublic: true, status: 'PUBLISHED' });
    expect(res.statusCode).toBe(200);
  });
});
