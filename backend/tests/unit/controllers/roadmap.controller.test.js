jest.mock('../../../models/Roadmap');
jest.mock('../../../services/ai.service');
jest.mock('../../../utils/usageHelper');

const Roadmap = require('../../../models/Roadmap');
const aiService = require('../../../services/ai.service');
const usageHelper = require('../../../utils/usageHelper');
const roadmapController = require('../../../controllers/roadmap.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');

describe('roadmap.controller.getRoadmap', () => {
  test('UTC001 - khong tim thay -> tra ve null (khong loi)', async () => {
    Roadmap.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { sourceId: 's1' } });
    await roadmapController.getRoadmap(req, res);
    expect(res._getData()).toBe('null');
    expect(res.statusCode).toBe(200);
  });

  test('UTC002 - tim thay -> tra ve roadmap', async () => {
    Roadmap.findOne.mockResolvedValue({ sourceId: 's1', content: { overview: 'x' } });
    const { req, res } = mockReqRes({ params: { sourceId: 's1' } });
    await roadmapController.getRoadmap(req, res);
    expect(res._getJSONData().sourceId).toBe('s1');
  });
});

describe('roadmap.controller.generateRoadmap', () => {
  test('UTC003 - candidate da het luot roadmap thang nay -> 403, khong goi AI', async () => {
    usageHelper.checkCandidateLimit.mockRejectedValue(new Error('LIMIT_EXCEEDED'));
    const { req, res } = mockReqRes({
      user: { id: 'u1', role: 'candidate' },
      body: { sourceId: 's1', testType: 'PRACTICE', timeframe: '1 thang', goal: 'X', testResult: { topic: 'JS', score: 5, totalQuestions: 10, weakSkills: ['closures'] } }
    });
    await roadmapController.generateRoadmap(req, res);
    expect(res.statusCode).toBe(403);
    expect(aiService.generateWithFallback).not.toHaveBeenCalled();
  });

  test('UTC004 - loi khac voi LIMIT_EXCEEDED tu usageHelper -> nem tiep ra ngoai, tra 500', async () => {
    usageHelper.checkCandidateLimit.mockRejectedValue(new Error('DB down'));
    const { req, res } = mockReqRes({
      user: { id: 'u1', role: 'candidate' },
      body: { sourceId: 's1', testType: 'PRACTICE', timeframe: '1 thang', goal: 'X', testResult: { topic: 'JS', score: 5, totalQuestions: 10, weakSkills: [] } }
    });
    await roadmapController.generateRoadmap(req, res);
    expect(res.statusCode).toBe(500);
  });

  test('UTC005 - candidate con luot -> goi AI, luu/ghi de Roadmap theo sourceId, tra 200', async () => {
    usageHelper.checkCandidateLimit.mockResolvedValue(true);
    aiService.generateWithFallback.mockResolvedValue({ overview: 'tom tat', weeks: [], suggestedCourses: [] });
    Roadmap.findOneAndUpdate.mockResolvedValue({ sourceId: 's1', content: { overview: 'tom tat' } });

    const { req, res } = mockReqRes({
      user: { id: 'u1', role: 'candidate' },
      body: { sourceId: 's1', testType: 'PRACTICE', timeframe: '1 thang', goal: 'Gioi Node.js', testResult: { topic: 'JS', score: 5, totalQuestions: 10, weakSkills: ['closures'] } }
    });
    await roadmapController.generateRoadmap(req, res);

    expect(Roadmap.findOneAndUpdate).toHaveBeenCalledWith(
      { sourceId: 's1' },
      expect.objectContaining({ content: { overview: 'tom tat', weeks: [], suggestedCourses: [] } }),
      { new: true, upsert: true }
    );
    expect(res.statusCode).toBe(200);
  });

  test('UTC006 - role business (khong phai candidate) -> khong bi kiem tra han muc', async () => {
    aiService.generateWithFallback.mockResolvedValue({ overview: 'x', weeks: [], suggestedCourses: [] });
    Roadmap.findOneAndUpdate.mockResolvedValue({ sourceId: 's2' });

    const { req, res } = mockReqRes({
      user: { id: 'u2', role: 'business' },
      body: { sourceId: 's2', testType: 'JOB', timeframe: '2 thang', goal: 'Y', testResult: { topic: 'React', score: 8, totalQuestions: 10, weakSkills: [], jd: 'JD text' } }
    });
    await roadmapController.generateRoadmap(req, res);

    expect(usageHelper.checkCandidateLimit).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  test('UTC007 - AI loi -> tra 500 kem thong bao "Loi tao lo trinh"', async () => {
    usageHelper.checkCandidateLimit.mockResolvedValue(true);
    aiService.generateWithFallback.mockRejectedValue(new Error('AI timeout'));

    const { req, res } = mockReqRes({
      user: { id: 'u1', role: 'candidate' },
      body: { sourceId: 's1', testType: 'PRACTICE', timeframe: '1 thang', goal: 'X', testResult: { topic: 'JS', score: 5, totalQuestions: 10, weakSkills: [] } }
    });
    await roadmapController.generateRoadmap(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().message).toMatch(/Lỗi tạo lộ trình/);
  });
});
