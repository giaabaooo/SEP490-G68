jest.mock('../../../models/Application');
jest.mock('../../../models/User');
jest.mock('../../../models/Job');
jest.mock('../../../models/Notification');
jest.mock('../../../models/Assessment');
jest.mock('../../../models/CVReview');
jest.mock('../../../models/CV');
jest.mock('../../../services/ai.service');
jest.mock('../../../utils/sendEmail');
jest.mock('../../../utils/notificationHelper');

const Application = require('../../../models/Application');
const User = require('../../../models/User');
const Job = require('../../../models/Job');
const Assessment = require('../../../models/Assessment');
const CVReview = require('../../../models/CVReview');
const aiService = require('../../../services/ai.service');
const { createNotification } = require('../../../utils/notificationHelper');
const applicationController = require('../../../controllers/application.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { freeCandidate, businessUser, job, application, oid } = require('../../helpers/fixtures');

beforeEach(() => {
  createNotification.mockResolvedValue({});
});

describe('application.controller.previewCVMatch', () => {
  test('UTC001 - candidate da het luot CV review thang nay -> 403', async () => {
    const candidate = freeCandidate();
    candidate.subscription.usage.cvReviewCount = 2;
    User.findById.mockResolvedValue(candidate);

    const { req, res } = mockReqRes({ user: { id: candidate._id, role: 'candidate' }, body: { jobId: oid() } });
    await applicationController.previewCVMatch(req, res);

    expect(res.statusCode).toBe(403);
    expect(aiService.calculateJobMatch).not.toHaveBeenCalled();
  });

  test('UTC002 - job khong ton tai -> 404', async () => {
    const candidate = freeCandidate();
    User.findById.mockResolvedValue(candidate);
    Job.findById.mockResolvedValue(null);

    const { req, res } = mockReqRes({ user: { id: candidate._id, role: 'candidate' }, body: { jobId: oid() } });
    await applicationController.previewCVMatch(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC003 - AI phan tich thanh cong -> tang usage, luu CVReview, tra 200', async () => {
    const candidate = freeCandidate();
    User.findById.mockResolvedValue(candidate);
    Job.findById.mockResolvedValue(job());
    aiService.calculateJobMatch.mockResolvedValue({ score: 82, verdict: 'Kha phu hop', pros: [], cons: [], advice: 'Tot' });
    CVReview.create.mockResolvedValue({});

    const { req, res } = mockReqRes({ user: { id: candidate._id, role: 'candidate' }, body: { jobId: oid() } });
    await applicationController.previewCVMatch(req, res);

    expect(candidate.subscription.usage.cvReviewCount).toBe(1);
    expect(candidate.save).toHaveBeenCalledTimes(1);
    expect(CVReview.create).toHaveBeenCalledWith(expect.objectContaining({ score: 82 }));
    expect(res.statusCode).toBe(200);
  });

  test('UTC004 - role business khong bi kiem tra han muc CV review', async () => {
    const biz = businessUser();
    User.findById.mockResolvedValue(biz);
    Job.findById.mockResolvedValue(job());
    aiService.calculateJobMatch.mockResolvedValue({ score: 70 });
    CVReview.create.mockResolvedValue({});

    const { req, res } = mockReqRes({ user: { id: biz._id, role: 'business' }, body: { jobId: oid() } });
    await applicationController.previewCVMatch(req, res);

    expect(res.statusCode).toBe(200);
  });
});

describe('application.controller.getReviewHistory', () => {
  test('UTC005 - tra ve danh sach lich su review theo jobId', async () => {
    CVReview.find.mockReturnValue(mockQuery([{ score: 80 }]));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { jobId: 'j1' } });
    await applicationController.getReviewHistory(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual([{ score: 80 }]);
  });
});

describe('application.controller.createApplication', () => {
  test('UTC006 - thieu jobId -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: {} });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC007 - job khong ton tai -> 404', async () => {
    Job.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC008 - job da dong -> 400', async () => {
    Job.findById.mockResolvedValue(job({ status: 'closed' }));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/đóng/);
  });

  test('UTC009 - qua han nop -> 400', async () => {
    Job.findById.mockResolvedValue(job({ recruitmentDeadline: new Date(Date.now() - 86400000) }));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/hết hạn/);
  });

  test('UTC010 - user khong ton tai -> 404', async () => {
    Job.findById.mockResolvedValue(job());
    User.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC011 - khong co CV nao (khong file, khong appliedCvId, khong cvUrl) -> 400', async () => {
    Job.findById.mockResolvedValue(job());
    User.findById.mockResolvedValue(freeCandidate({ cvUrl: '' }));
    Application.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/cung cấp CV/);
  });

  test('UTC012 - da nop du 3 lan -> 400', async () => {
    Job.findById.mockResolvedValue(job());
    User.findById.mockResolvedValue(freeCandidate({ cvUrl: '/uploads/cvs/a.pdf' }));
    Application.findOne.mockResolvedValue(application({ applyCount: 3, status: 'Rejected' }));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/giới hạn 3 lần/);
  });

  test('UTC013 - ho so dang o vong Interviewing -> khong cho nop lai -> 400', async () => {
    Job.findById.mockResolvedValue(job());
    User.findById.mockResolvedValue(freeCandidate({ cvUrl: '/uploads/cvs/a.pdf' }));
    Application.findOne.mockResolvedValue(application({ applyCount: 1, status: 'Interviewing' }));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/không thể nộp lại/);
  });

  test('UTC014 - job.useAiReview = false -> bo qua AI, khong tru token doanh nghiep', async () => {
    Job.findById.mockResolvedValue(job({ useAiReview: false }));
    User.findById.mockResolvedValue(freeCandidate({ cvUrl: '/uploads/cvs/a.pdf' }));
    Application.findOne.mockResolvedValue(null);
    Assessment.findOne.mockResolvedValue(null);
    Application.create.mockResolvedValue(application());
    Application.updateOne.mockResolvedValue({});
    Application.findById.mockReturnValue(mockQuery(application()));

    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);

    expect(aiService.evaluateCVMatch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  test('UTC015 - doanh nghiep khong du 30 token -> bo qua AI, van tao ho so', async () => {
    Job.findById.mockResolvedValue(job({ useAiReview: true }));
    User.findById
      .mockResolvedValueOnce(freeCandidate({ cvUrl: '/uploads/cvs/a.pdf' }))
      .mockResolvedValueOnce(businessUser({ businessCredits: { balance: 10 } }));
    Application.findOne.mockResolvedValue(null);
    Assessment.findOne.mockResolvedValue(null);
    Application.create.mockResolvedValue(application());
    Application.updateOne.mockResolvedValue({});
    Application.findById.mockReturnValue(mockQuery(application()));

    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);

    expect(aiService.evaluateCVMatch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  test('UTC016 - AI thanh cong va doanh nghiep du token -> tru 30 token, luu aiScore', async () => {
    const biz = businessUser({ businessCredits: { balance: 100 } });
    Job.findById.mockResolvedValue(job({ useAiReview: true, recruiterId: biz._id }));
    User.findById
      .mockResolvedValueOnce(freeCandidate({ cvUrl: '/uploads/cvs/a.pdf' }))
      .mockResolvedValueOnce(biz);
    Application.findOne.mockResolvedValue(null);
    Assessment.findOne.mockResolvedValue(null);
    aiService.evaluateCVMatch.mockResolvedValue({ score: 88, verdict: 'Tot', reasonToHire: '', reasonToReject: '', categoryScores: [] });
    Application.create.mockResolvedValue(application({ aiScore: 88 }));
    Application.updateOne.mockResolvedValue({});
    Application.findById.mockReturnValue(mockQuery(application({ aiScore: 88 })));

    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);

    expect(biz.businessCredits.balance).toBe(70);
    expect(biz.save).toHaveBeenCalledTimes(1);
    expect(Application.create).toHaveBeenCalledWith(expect.objectContaining({ aiScore: 88 }));
    expect(res.statusCode).toBe(201);
  });

  test('UTC017 - ho so da ton tai (nop lai) -> cap nhat, tra 200 va tang applyCount', async () => {
    Job.findById.mockResolvedValue(job({ useAiReview: false }));
    User.findById.mockResolvedValue(freeCandidate({ cvUrl: '/uploads/cvs/a.pdf' }));
    Application.findOne.mockResolvedValue(application({ applyCount: 1, status: 'Rejected' }));
    Assessment.findOne.mockResolvedValue(null);
    Application.findOneAndUpdate.mockResolvedValue({});
    Application.findById.mockReturnValue(mockQuery(application()));

    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'candidate' }, body: { jobId: 'j1' } });
    await applicationController.createApplication(req, res);

    expect(Application.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.anything() },
      expect.objectContaining({ $inc: { applyCount: 1 } }),
      expect.any(Object)
    );
    expect(res.statusCode).toBe(200);
  });
});

describe('application.controller.list', () => {
  test('UTC018 - role business chi thay ho so cua job minh dang', async () => {
    Job.find.mockReturnValue(mockQuery([{ _id: 'j1' }]));
    Application.countDocuments.mockResolvedValue(1);
    Application.find.mockReturnValue(mockQuery([application()]));

    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, query: {} });
    await applicationController.list(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().total).toBe(1);
  });

  test('UTC019 - tim kiem khong co user nao khop -> tra ve mang rong ngay, khong query Application', async () => {
    User.find.mockReturnValue(mockQuery([]));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'admin' }, query: { search: 'khongton tai' } });
    await applicationController.list(req, res);

    expect(res._getJSONData()).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    expect(Application.find).not.toHaveBeenCalled();
  });
});

describe('application.controller.getById', () => {
  test('UTC020 - khong tim thay -> 404', async () => {
    Application.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' } });
    await applicationController.getById(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC021 - business truy cap ho so cua job khac -> 403', async () => {
    const app = application({ jobId: { recruiterId: oid() } });
    Application.findById.mockReturnValue(mockQuery(app));
    const { req, res } = mockReqRes({ user: { id: 'someone-else', role: 'business' }, params: { id: 'a1' } });
    await applicationController.getById(req, res);
    expect(res.statusCode).toBe(403);
  });
});

describe('application.controller.updateStatus', () => {
  test('UTC022 - status khong hop le -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' }, body: { status: 'Unknown' } });
    await applicationController.updateStatus(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC023 - khong tim thay ho so -> 404', async () => {
    Application.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' }, body: { status: 'Offered' } });
    await applicationController.updateStatus(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC024 - business khong co quyen tren job nay -> 403', async () => {
    const app = application({ jobId: { _id: 'j1', recruiterId: oid(), title: 'X' } });
    Application.findById.mockReturnValue(mockQuery(app));
    const { req, res } = mockReqRes({ user: { id: 'khac-id', role: 'business' }, params: { id: 'a1' }, body: { status: 'Offered' } });
    await applicationController.updateStatus(req, res);
    expect(res.statusCode).toBe(403);
  });

  test('UTC025 - hop le -> cap nhat status, gui thong bao, tra 200', async () => {
    const recruiterId = oid();
    const app = application({ jobId: { _id: 'j1', recruiterId, title: 'Backend Dev' } });
    Application.findById.mockReturnValue(mockQuery(app));
    Application.findById.mockReturnValueOnce(mockQuery(app));
    const updatedApp = application();
    Application.findById.mockReturnValue(mockQuery(updatedApp));

    const { req, res } = mockReqRes({ user: { id: recruiterId, role: 'business' }, params: { id: 'a1' }, body: { status: 'Offered' } });
    await applicationController.updateStatus(req, res);

    expect(app.status).toBe('Offered');
    expect(app.save).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});

describe('application.controller.sendNotification', () => {
  test('UTC026 - thieu subject/content -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' }, body: {} });
    await applicationController.sendNotification(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC027 - ung vien khong co email -> 400', async () => {
    const app = application({ userId: { _id: 'u1', fullName: 'A' }, jobId: { recruiterId: 'u1', title: 'X' } });
    Application.findById.mockReturnValue(mockQuery(app));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' }, body: { subject: 'S', content: 'C' } });
    await applicationController.sendNotification(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC028 - hop le -> gui email, cap nhat mailSentStatus, tra 200', async () => {
    const app = application({ userId: { _id: 'u1', fullName: 'A', email: 'a@a.com' }, jobId: { recruiterId: 'u1', title: 'X' }, status: 'Applied' });
    Application.findById.mockReturnValue(mockQuery(app));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' }, body: { subject: 'S', content: 'C', type: 'Pass' } });
    await applicationController.sendNotification(req, res);
    expect(app.mailSentStatus).toBe('Sent_Pass');
    expect(res.statusCode).toBe(200);
  });
});

describe('application.controller.reEvaluate', () => {
  test('UTC029 - ho so khong ton tai -> 404', async () => {
    Application.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' }, params: { id: 'a1' } });
    await applicationController.reEvaluate(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC030 - business khong co quyen tren job -> 403', async () => {
    const jobId = oid();
    const app = application({ jobId: { _id: jobId }, userId: freeCandidate() });
    Application.findById.mockReturnValue(mockQuery(app));
    Job.findById.mockResolvedValue(job({ _id: jobId, recruiterId: oid() }));

    const { req, res } = mockReqRes({ user: { id: 'nguoi-khac', role: 'business' }, params: { id: 'a1' } });
    await applicationController.reEvaluate(req, res);
    expect(res.statusCode).toBe(403);
  });

  test('UTC031 - AI cham lai thanh cong -> cap nhat aiScore, tra 200', async () => {
    const recruiterId = oid();
    const jobId = oid();
    const app = application({ jobId: { _id: jobId }, userId: freeCandidate() });
    Application.findById
      .mockReturnValueOnce(mockQuery(app))
      .mockReturnValueOnce(mockQuery(application({ aiScore: 91 })));
    Job.findById.mockResolvedValue(job({ _id: jobId, recruiterId }));
    aiService.evaluateCVMatch.mockResolvedValue({ score: 91, verdict: 'Xuat sac', reasonToHire: '', reasonToReject: '', categoryScores: [] });

    const { req, res } = mockReqRes({ user: { id: recruiterId, role: 'business' }, params: { id: 'a1' } });
    await applicationController.reEvaluate(req, res);

    expect(app.aiScore).toBe(91);
    expect(app.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});
