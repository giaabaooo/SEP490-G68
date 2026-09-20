jest.mock('../../../services/ai.service');
jest.mock('../../../models/InterviewTemplate');
jest.mock('../../../models/InterviewHistory');
jest.mock('../../../models/User');
jest.mock('../../../models/Job');
jest.mock('../../../models/CV');

const aiService = require('../../../services/ai.service');
const InterviewHistory = require('../../../models/InterviewHistory');
const User = require('../../../models/User');
const Job = require('../../../models/Job');
const CV = require('../../../models/CV');
const interviewController = require('../../../controllers/interview.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { freeCandidate, proCandidate, job, oid } = require('../../helpers/fixtures');

describe('interview.controller.conductInterview', () => {
  test('UTC001 - user khong ton tai -> 404', async () => {
    User.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: {} });
    await interviewController.conductInterview(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC002 - candidate free da dung het 15/15 phut -> 403 LIMIT_EXCEEDED, khong goi AI', async () => {
    const user = freeCandidate();
    user.subscription.usage.mockInterviewMinutes = 15;
    User.findById.mockResolvedValue(user);
    CV.findOne.mockReturnValue(mockQuery(null));

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: {} });
    await interviewController.conductInterview(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._getJSONData().code).toBe('LIMIT_EXCEEDED');
    expect(aiService.conductMockInterview).not.toHaveBeenCalled();
  });

  test('UTC003 - con luot -> goi AI, tang mockInterviewMinutes len 1, tra ve remainingTime', async () => {
    const user = freeCandidate();
    User.findById.mockResolvedValue(user);
    CV.findOne.mockReturnValue(mockQuery(null));
    Job.findById.mockResolvedValue(null);
    aiService.conductMockInterview.mockResolvedValue({
      feedback: 'Tot', nextQuestion: 'Cau hoi tiep theo?', hint: '', fullText: '', audioData: null, isFinished: false
    });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { history: [], jobPosition: 'Backend Dev' } });
    await interviewController.conductInterview(req, res);

    expect(user.subscription.usage.mockInterviewMinutes).toBe(1);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res._getJSONData().remainingTime).toBe(14);
    expect(res.statusCode).toBe(200);
  });

  test('UTC004 - candidate pro da het han goi (endDate qua han) -> tinh nhu free, van con luot thi cho tiep tuc', async () => {
    const user = proCandidate();
    user.subscription.endDate = new Date(Date.now() - 1000);
    User.findById.mockResolvedValue(user);
    CV.findOne.mockReturnValue(mockQuery(null));
    Job.findById.mockResolvedValue(null);
    aiService.conductMockInterview.mockResolvedValue({ feedback: '', nextQuestion: '', hint: '', fullText: '', audioData: null, isFinished: false });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: {} });
    await interviewController.conductInterview(req, res);

    expect(res._getJSONData().remainingTime).toBe(14);
  });

  test('UTC005 - co jobId -> lay Job that trong he thong lam ngu canh phong van', async () => {
    const user = freeCandidate();
    User.findById.mockResolvedValue(user);
    CV.findOne.mockReturnValue(mockQuery(null));
    Job.findById.mockReturnValue(mockQuery(job({ title: 'Senior Dev', companyName: 'Acme' })));
    aiService.conductMockInterview.mockResolvedValue({ feedback: '', nextQuestion: '', hint: '', fullText: '', audioData: null, isFinished: false });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { jobId: 'j1' } });
    await interviewController.conductInterview(req, res);

    expect(res._getJSONData().jobContext.title).toBe('Senior Dev');
  });
});

describe('interview.controller.evaluateInterview', () => {
  test('UTC006 - khong co ID user -> 401', async () => {
    const { req, res } = mockReqRes({ user: {}, body: { history: [] } });
    await interviewController.evaluateInterview(req, res);
    expect(res.statusCode).toBe(401);
  });

  test('UTC007 - ung vien chua tra loi cau nao -> tra ve ket qua danh gia 0 diem, khong goi AI', async () => {
    User.findById.mockResolvedValue(freeCandidate());
    InterviewHistory.create.mockResolvedValue({ _id: oid() });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { history: [{ role: 'model', content: 'Hello' }] } });
    await interviewController.evaluateInterview(req, res);

    expect(aiService.evaluateInterview).not.toHaveBeenCalled();
    expect(res._getJSONData().score).toBe(0);
  });

  test('UTC008 - co cau tra loi -> goi AI danh gia va luu InterviewHistory', async () => {
    User.findById.mockResolvedValue(freeCandidate());
    aiService.evaluateInterview.mockResolvedValue({ score: 85, matchRating: 'Phu hop', overview: '', strengths: [], weaknesses: [], improvements: [] });
    InterviewHistory.create.mockResolvedValue({ _id: oid() });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { history: [{ role: 'user', content: 'Toi co 2 nam kinh nghiem' }] } });
    await interviewController.evaluateInterview(req, res);

    expect(res._getJSONData().score).toBe(85);
    expect(res._getJSONData().historyId).toBeDefined();
  });

  test('UTC009 - AI tra ve thieu score -> gan mac dinh 0', async () => {
    User.findById.mockResolvedValue(freeCandidate());
    aiService.evaluateInterview.mockResolvedValue({ matchRating: 'x', overview: '', strengths: [], weaknesses: [], improvements: [] });
    InterviewHistory.create.mockResolvedValue({ _id: oid() });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { history: [{ role: 'user', content: 'tra loi' }] } });
    await interviewController.evaluateInterview(req, res);

    expect(res._getJSONData().score).toBe(0);
  });
});

describe('interview.controller.getAvailableTemplates', () => {
  test('UTC010 - tra ve danh sach job active lam template phong van', async () => {
    Job.find.mockReturnValue(mockQuery([job({ title: 'Backend Dev' })]));
    const { req, res } = mockReqRes();
    await interviewController.getAvailableTemplates(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()[0].jobPosition).toBe('Backend Dev');
  });
});

describe('interview.controller.getInterviewHistory', () => {
  test('UTC011 - khong co ID user -> 401', async () => {
    const { req, res } = mockReqRes({ user: {} });
    await interviewController.getInterviewHistory(req, res);
    expect(res.statusCode).toBe(401);
  });

  test('UTC012 - tra ve lich su kem questionCount (dem so tin nhan role=model)', async () => {
    InterviewHistory.find.mockReturnValue(mockQuery([
      { messages: [{ role: 'model' }, { role: 'user' }, { role: 'model' }] }
    ]));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await interviewController.getInterviewHistory(req, res);
    expect(res._getJSONData()[0].questionCount).toBe(2);
  });
});
