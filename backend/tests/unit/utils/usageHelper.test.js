jest.mock('../../../models/User');
jest.mock('../../../models/Job');

const User = require('../../../models/User');
const Job = require('../../../models/Job');
const { checkCandidateLimit, checkBusinessToken, checkJobQuotaToken } = require('../../../utils/usageHelper');
const { freeCandidate, proCandidate } = require('../../helpers/fixtures');

describe('usageHelper.checkCandidateLimit', () => {
  test('UTC001 - user khong ton tai -> throw User not found', async () => {
    User.findById.mockResolvedValue(null);
    await expect(checkCandidateLimit('u1', 'cv_review')).rejects.toThrow('User not found');
  });

  test('UTC002 - role business -> tra ve true, khong tru luot, khong save', async () => {
    const user = { role: 'business', save: jest.fn() };
    User.findById.mockResolvedValue(user);
    await expect(checkCandidateLimit('u1', 'cv_review')).resolves.toBe(true);
    expect(user.save).not.toHaveBeenCalled();
  });

  test('UTC003 - candidate free, cv_review, con luot -> tang bo dem va tra ve true', async () => {
    const user = freeCandidate();
    user.subscription.usage.cvReviewCount = 0;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'cv_review')).resolves.toBe(true);
    expect(user.subscription.usage.cvReviewCount).toBe(1);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test('UTC004 - candidate free, cv_review, da dung 2/2 -> throw LIMIT_EXCEEDED', async () => {
    const user = freeCandidate();
    user.subscription.usage.cvReviewCount = 2;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'cv_review')).rejects.toThrow('LIMIT_EXCEEDED');
    expect(user.subscription.usage.cvReviewCount).toBe(2);
  });

  test('UTC005 - candidate pro, cv_review, con luot (49/50) -> tang bo dem', async () => {
    const user = proCandidate();
    user.subscription.usage.cvReviewCount = 49;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'cv_review')).resolves.toBe(true);
    expect(user.subscription.usage.cvReviewCount).toBe(50);
  });

  test('UTC006 - candidate pro, cv_review, da dung 50/50 -> throw LIMIT_EXCEEDED', async () => {
    const user = proCandidate();
    user.subscription.usage.cvReviewCount = 50;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'cv_review')).rejects.toThrow('LIMIT_EXCEEDED');
  });

  test('UTC007 - candidate free, interview, da dung 15/15 -> throw LIMIT_EXCEEDED', async () => {
    const user = freeCandidate();
    user.subscription.usage.mockInterviewMinutes = 15;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'interview')).rejects.toThrow('LIMIT_EXCEEDED');
  });

  test('UTC008 - candidate pro, interview, con luot (179/180) -> tang bo dem', async () => {
    const user = proCandidate();
    user.subscription.usage.mockInterviewMinutes = 179;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'interview')).resolves.toBe(true);
    expect(user.subscription.usage.mockInterviewMinutes).toBe(180);
  });

  test('UTC009 - candidate free, roadmap, da dung 1/1 -> throw LIMIT_EXCEEDED', async () => {
    const user = freeCandidate();
    user.subscription.usage.roadmapCount = 1;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'roadmap')).rejects.toThrow('LIMIT_EXCEEDED');
  });

  test('UTC010 - lastResetDate qua 30 ngay -> reset ca 3 bo dem ve 0 truoc khi tang', async () => {
    const user = freeCandidate();
    user.subscription.usage.cvReviewCount = 2;
    user.subscription.usage.mockInterviewMinutes = 10;
    user.subscription.usage.roadmapCount = 1;
    user.subscription.usage.lastResetDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'cv_review')).resolves.toBe(true);
    expect(user.subscription.usage.cvReviewCount).toBe(1);
    expect(user.subscription.usage.mockInterviewMinutes).toBe(0);
    expect(user.subscription.usage.roadmapCount).toBe(0);
  });

  test('UTC011 - pro nhung endDate da qua han -> tinh nhu goi free (ap dung limit free)', async () => {
    const user = proCandidate();
    user.subscription.endDate = new Date(Date.now() - 1000);
    user.subscription.usage.cvReviewCount = 2;
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'cv_review')).rejects.toThrow('LIMIT_EXCEEDED');
  });

  test('UTC012 - feature khong xac dinh -> khong tang bo dem nao, van tra ve true', async () => {
    const user = freeCandidate();
    User.findById.mockResolvedValue(user);

    await expect(checkCandidateLimit('u1', 'unknown_feature')).resolves.toBe(true);
    expect(user.subscription.usage.cvReviewCount).toBe(0);
    expect(user.subscription.usage.mockInterviewMinutes).toBe(0);
    expect(user.subscription.usage.roadmapCount).toBe(0);
    expect(user.save).toHaveBeenCalledTimes(1);
  });
});

describe('usageHelper.checkBusinessToken', () => {
  test('UTC013 - user khong ton tai -> throw User not found', async () => {
    User.findById.mockResolvedValue(null);
    await expect(checkBusinessToken('u1', 30)).rejects.toThrow('User not found');
  });

  test('UTC014 - role admin -> mien tru, tra ve true, khong tru token', async () => {
    const user = { role: 'admin', businessCredits: { balance: 0 }, save: jest.fn() };
    User.findById.mockResolvedValue(user);
    await expect(checkBusinessToken('u1', 30)).resolves.toBe(true);
    expect(user.save).not.toHaveBeenCalled();
  });

  test('UTC015 - subRole admin (khong phai role admin) -> mien tru', async () => {
    const user = { role: 'business', subRole: 'admin', businessCredits: { balance: 0 }, save: jest.fn() };
    User.findById.mockResolvedValue(user);
    await expect(checkBusinessToken('u1', 30)).resolves.toBe(true);
    expect(user.save).not.toHaveBeenCalled();
  });

  test('UTC016 - business du token -> tru dung so luong va tra ve so du moi', async () => {
    const user = { role: 'business', businessCredits: { balance: 200 }, save: jest.fn() };
    User.findById.mockResolvedValue(user);
    await expect(checkBusinessToken('u1', 30)).resolves.toBe(170);
    expect(user.businessCredits.balance).toBe(170);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test('UTC017 - business khong du token -> throw INSUFFICIENT_TOKENS, khong tru', async () => {
    const user = { role: 'business', businessCredits: { balance: 10 }, save: jest.fn() };
    User.findById.mockResolvedValue(user);
    await expect(checkBusinessToken('u1', 30)).rejects.toThrow('INSUFFICIENT_TOKENS');
    expect(user.businessCredits.balance).toBe(10);
    expect(user.save).not.toHaveBeenCalled();
  });

  test('UTC018 - balance dung bang tokenCost -> van tru thanh cong (bien)', async () => {
    const user = { role: 'business', businessCredits: { balance: 30 }, save: jest.fn() };
    User.findById.mockResolvedValue(user);
    await expect(checkBusinessToken('u1', 30)).resolves.toBe(0);
  });
});

describe('usageHelper.checkJobQuotaToken', () => {
  test('UTC019 - job khong ton tai -> throw Job not found', async () => {
    Job.findById.mockResolvedValue(null);
    await expect(checkJobQuotaToken('j1', 50)).rejects.toThrow('Job not found');
  });

  test('UTC020 - job khong co field aiTokensQuota -> coi nhu 0, khong du -> throw INSUFFICIENT_JOB_QUOTA', async () => {
    const job = { save: jest.fn() };
    Job.findById.mockResolvedValue(job);
    await expect(checkJobQuotaToken('j1', 50)).rejects.toThrow('INSUFFICIENT_JOB_QUOTA');
  });

  test('UTC021 - job du quota -> tru dung so luong va tra ve quota con lai', async () => {
    const job = { aiTokensQuota: 200, save: jest.fn() };
    Job.findById.mockResolvedValue(job);
    await expect(checkJobQuotaToken('j1', 50)).resolves.toBe(150);
    expect(job.aiTokensQuota).toBe(150);
    expect(job.save).toHaveBeenCalledTimes(1);
  });

  test('UTC022 - job khong du quota -> throw INSUFFICIENT_JOB_QUOTA, khong tru', async () => {
    const job = { aiTokensQuota: 20, save: jest.fn() };
    Job.findById.mockResolvedValue(job);
    await expect(checkJobQuotaToken('j1', 50)).rejects.toThrow('INSUFFICIENT_JOB_QUOTA');
    expect(job.aiTokensQuota).toBe(20);
    expect(job.save).not.toHaveBeenCalled();
  });
});
