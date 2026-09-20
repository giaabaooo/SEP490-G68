jest.mock('../../../models/Job');
jest.mock('../../../models/User');
jest.mock('../../../models/Otp');
jest.mock('../../../utils/sendEmail');
jest.mock('../../../utils/notificationHelper');

const Job = require('../../../models/Job');
const User = require('../../../models/User');
const Otp = require('../../../models/Otp');
const { createNotification } = require('../../../utils/notificationHelper');
const jobController = require('../../../controllers/job.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { job, businessUser, oid } = require('../../helpers/fixtures');

beforeEach(() => {
  createNotification.mockResolvedValue({});
  User.findById.mockReset();
  User.findOne.mockReset();
  // serializeJob() luon goi User.findById(...).select(...).lean() de lay thong tin recruiter
  User.findById.mockReturnValue(mockQuery(null));
});

function leanJob(overrides = {}) {
  return job(overrides);
}

describe('job.controller.getJobs', () => {
  test('UTC001 - co recruiterId trong query -> chi loc job active cua recruiter do', async () => {
    Job.find.mockReturnValue(mockQuery([]));
    const { req, res } = mockReqRes({ query: { recruiterId: 'r1' } });
    await jobController.getJobs(req, res);
    expect(Job.find).toHaveBeenCalledWith(expect.objectContaining({ recruiterId: 'r1', status: 'active' }));
    expect(res.statusCode).toBe(200);
  });

  test('UTC002 - business xem job cua chinh minh -> loc theo recruiterId = req.user.id, khong ep status', async () => {
    Job.find.mockReturnValue(mockQuery([]));
    const { req, res } = mockReqRes({ user: { id: 'biz1', role: 'business' }, query: {} });
    await jobController.getJobs(req, res);
    expect(Job.find).toHaveBeenCalledWith({ recruiterId: 'biz1' });
  });

  test('UTC003 - guest/candidate -> chi thay job active', async () => {
    Job.find.mockReturnValue(mockQuery([]));
    const { req, res } = mockReqRes({ query: {} });
    await jobController.getJobs(req, res);
    expect(Job.find).toHaveBeenCalledWith({ status: 'active' });
  });

  test('UTC004 - co keyword -> dung $or tim theo title/tags/recruiterId cong ty khop', async () => {
    User.find.mockReturnValue(mockQuery([]));
    Job.find.mockReturnValue(mockQuery([]));
    const { req, res } = mockReqRes({ query: { keyword: 'nodejs' } });
    await jobController.getJobs(req, res);
    const calledWith = Job.find.mock.calls[0][0];
    expect(calledWith.$or).toBeDefined();
  });
});

describe('job.controller.getJobById', () => {
  test('UTC005 - job khong ton tai -> 404', async () => {
    Job.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 'j1' } });
    await jobController.getJobById(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC006 - job trang thai draft, nguoi xem khong phai owner/moderator -> 404 (an tin)', async () => {
    Job.findById.mockReturnValue(mockQuery(leanJob({ status: 'draft', recruiterId: 'owner1' })));
    const { req, res } = mockReqRes({ user: { id: 'khac', role: 'candidate' }, params: { id: 'j1' } });
    await jobController.getJobById(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC007 - job draft nhung nguoi xem la chu tin -> van thay duoc', async () => {
    Job.findById.mockReturnValue(mockQuery(leanJob({ status: 'draft', recruiterId: 'owner1' })));
    const { req, res } = mockReqRes({ user: { id: 'owner1', role: 'business' }, params: { id: 'j1' } });
    await jobController.getJobById(req, res);
    expect(res.statusCode).toBe(200);
  });

  test('UTC008 - job active -> ai xem cung duoc', async () => {
    Job.findById.mockReturnValue(mockQuery(leanJob({ status: 'active' })));
    const { req, res } = mockReqRes({ params: { id: 'j1' } });
    await jobController.getJobById(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('job.controller.createJob', () => {
  test('UTC009 - thieu truong bat buoc -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'biz1' }, body: { title: 'A' } });
    await jobController.createJob(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC010 - deadline khong hop le -> 400', async () => {
    const { req, res } = mockReqRes({
      user: { id: 'biz1' },
      body: { title: 'A', description: 'B', requirements: 'C', deadline: 'not-a-date' }
    });
    await jobController.createJob(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC011 - requireTest=true nhung khong du 200 token -> 402, khong tao job', async () => {
    User.findById.mockResolvedValue(businessUser({ businessCredits: { balance: 50 } }));
    const { req, res } = mockReqRes({
      user: { id: 'biz1' },
      body: { title: 'A', description: 'B', requirements: 'C', deadline: '2030-01-01', requireTest: true }
    });
    await jobController.createJob(req, res);
    expect(res.statusCode).toBe(402);
    expect(Job.create).not.toHaveBeenCalled();
  });

  test('UTC012 - requireTest=true va du token -> tru 200 token, status draft, aiTokensQuota=200', async () => {
    const biz = businessUser({ businessCredits: { balance: 500 } });
    // 1) check so du de tru token goi User.findById(...) (khong co .select chain)
    // 2) serializeJob() goi User.findById(...).select().lean() de lay recruiter
    User.findById
      .mockResolvedValueOnce(biz)
      .mockReturnValue(mockQuery(biz));
    Job.create.mockResolvedValue(job({ requireTest: true, status: 'draft', aiTokensQuota: 200, recruiterId: biz._id }));

    const { req, res } = mockReqRes({
      user: { id: 'biz1' },
      body: { title: 'A', description: 'B', requirements: 'C', deadline: '2030-01-01', requireTest: true }
    });
    await jobController.createJob(req, res);

    expect(biz.businessCredits.balance).toBe(300);
    expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft', aiTokensQuota: 200, requireTest: true }));
    expect(res.statusCode).toBe(201);
  });

  test('UTC013 - requireTest=false -> job active ngay, khong tru token', async () => {
    Job.create.mockResolvedValue(job({ requireTest: false, status: 'active' }));

    const { req, res } = mockReqRes({
      user: { id: 'biz1' },
      body: { title: 'A', description: 'B', requirements: 'C', deadline: '2030-01-01' }
    });
    await jobController.createJob(req, res);

    expect(Job.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', aiTokensQuota: 0 }));
    expect(res.statusCode).toBe(201);
  });
});

describe('job.controller.updateJob', () => {
  test('UTC014 - job khong ton tai -> 404', async () => {
    Job.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'biz1' }, params: { id: 'j1' }, body: {} });
    await jobController.updateJob(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC015 - khong phai chu tin -> 403', async () => {
    Job.findById.mockResolvedValue(job({ recruiterId: 'owner1' }));
    const { req, res } = mockReqRes({ user: { id: 'khac' }, params: { id: 'j1' }, body: {} });
    await jobController.updateJob(req, res);
    expect(res.statusCode).toBe(403);
  });

  test('UTC016 - bat requireTest tu false sang true nhung khong du token -> 402', async () => {
    Job.findById.mockResolvedValue(job({ recruiterId: 'biz1', requireTest: false }));
    User.findById.mockResolvedValue(businessUser({ businessCredits: { balance: 10 } }));
    const { req, res } = mockReqRes({ user: { id: 'biz1' }, params: { id: 'j1' }, body: { requireTest: true } });
    await jobController.updateJob(req, res);
    expect(res.statusCode).toBe(402);
  });

  test('UTC017 - bat requireTest tu false sang true, du token -> tru 200, testStatus=pending, status=draft', async () => {
    const currentJob = job({ recruiterId: 'biz1', requireTest: false, moderatorEmail: '' });
    Job.findById.mockResolvedValue(currentJob);
    const biz = businessUser({ businessCredits: { balance: 500 } });
    // 1) check so du tru token: User.findById(...) tra thang gia tri
    // 2) serializeJob(): User.findById(...).select().lean()
    User.findById
      .mockResolvedValueOnce(biz)
      .mockReturnValue(mockQuery(biz));

    const { req, res } = mockReqRes({ user: { id: 'biz1' }, params: { id: 'j1' }, body: { requireTest: true } });
    await jobController.updateJob(req, res);

    expect(biz.businessCredits.balance).toBe(300);
    expect(currentJob.testStatus).toBe('pending');
    expect(currentJob.status).toBe('draft');
    expect(currentJob.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('UTC018 - deadline moi khong hop le -> 400', async () => {
    Job.findById.mockResolvedValue(job({ recruiterId: 'biz1' }));
    const { req, res } = mockReqRes({ user: { id: 'biz1' }, params: { id: 'j1' }, body: { deadline: 'invalid' } });
    await jobController.updateJob(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC019 - cap nhat status hop le -> luu va tra 200', async () => {
    Job.findById.mockResolvedValue(job({ recruiterId: 'biz1', requireTest: false, moderatorEmail: '' }));
    const { req, res } = mockReqRes({ user: { id: 'biz1' }, params: { id: 'j1' }, body: { status: 'closed' } });
    await jobController.updateJob(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('job.controller.getModeratorRequests', () => {
  test('UTC020 - user khong ton tai -> 404', async () => {
    User.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await jobController.getModeratorRequests(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC021 - tra ve danh sach job duoc phan cong lam moderator', async () => {
    User.findById.mockResolvedValue({ email: 'mod@x.com' });
    Job.find.mockReturnValue(mockQuery([leanJob({ requireTest: true, moderatorEmail: 'mod@x.com' })]));

    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await jobController.getModeratorRequests(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveLength(1);
  });
});
