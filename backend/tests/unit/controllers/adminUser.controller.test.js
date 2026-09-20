jest.mock('../../../models/User');

const User = require('../../../models/User');
const adminUserController = require('../../../controllers/adminUser.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { freeCandidate, businessUser, oid } = require('../../helpers/fixtures');

describe('adminUser.controller.getUsers', () => {
  test('UTC001 - khong loc -> tra ve danh sach va phan trang mac dinh', async () => {
    User.find.mockReturnValue(mockQuery([freeCandidate()]));
    User.countDocuments.mockResolvedValue(1);
    const { req, res } = mockReqRes({ query: {} });
    await adminUserController.getUsers(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().pagination.total).toBe(1);
  });

  test('UTC002 - loc theo role hop le -> ap dung dieu kien role', async () => {
    User.find.mockReturnValue(mockQuery([]));
    User.countDocuments.mockResolvedValue(0);
    const { req, res } = mockReqRes({ query: { role: 'business' } });
    await adminUserController.getUsers(req, res);
    expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ role: 'business' }));
  });

  test('UTC003 - role khong hop le -> bo qua dieu kien role', async () => {
    User.find.mockReturnValue(mockQuery([]));
    User.countDocuments.mockResolvedValue(0);
    const { req, res } = mockReqRes({ query: { role: 'hacker' } });
    await adminUserController.getUsers(req, res);
    expect(User.find).toHaveBeenCalledWith({});
  });
});

describe('adminUser.controller.getUserById', () => {
  test('UTC004 - khong ton tai -> 404', async () => {
    User.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 'u1' } });
    await adminUserController.getUserById(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC005 - ton tai -> tra ve user', async () => {
    User.findById.mockReturnValue(mockQuery(freeCandidate()));
    const { req, res } = mockReqRes({ params: { id: 'u1' } });
    await adminUserController.getUserById(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('adminUser.controller.updateUser', () => {
  test('UTC006 - user khong ton tai -> 404', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 'u1' }, body: { fullName: 'B' } });
    await adminUserController.updateUser(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC007 - hop le -> chi cap nhat cac field duoc gui len', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(freeCandidate({ fullName: 'B' })));
    const { req, res } = mockReqRes({ params: { id: 'u1' }, body: { fullName: 'B' } });
    await adminUserController.updateUser(req, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { $set: { fullName: 'B' } }, expect.any(Object));
    expect(res.statusCode).toBe(200);
  });
});

describe('adminUser.controller.updateUserStatus', () => {
  test('UTC008 - status khong hop le -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'u1' }, body: { status: 'unknown' } });
    await adminUserController.updateUserStatus(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC009 - admin tu khoa chinh minh -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'admin1' }, body: { status: 'banned' } });
    await adminUserController.updateUserStatus(req, res);
    expect(res.statusCode).toBe(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('UTC010 - user khong ton tai -> 404', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'u2' }, body: { status: 'banned' } });
    await adminUserController.updateUserStatus(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC011 - khoa nguoi khac -> 200, thong bao "Khoa tai khoan thanh cong"', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(freeCandidate({ status: 'banned' })));
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'u2' }, body: { status: 'banned' } });
    await adminUserController.updateUserStatus(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().message).toMatch(/Khóa tài khoản/);
  });
});

describe('adminUser.controller.updateUserRole', () => {
  test('UTC012 - role khong hop le -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'u1' }, body: { role: 'superuser' } });
    await adminUserController.updateUserRole(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC013 - admin tu ha quyen chinh minh -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'admin1' }, body: { role: 'candidate' } });
    await adminUserController.updateUserRole(req, res);
    expect(res.statusCode).toBe(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('UTC014 - admin tu giu nguyen quyen admin cho chinh minh -> cho phep', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(freeCandidate({ role: 'admin' })));
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'admin1' }, body: { role: 'admin' } });
    await adminUserController.updateUserRole(req, res);
    expect(res.statusCode).toBe(200);
  });

  test('UTC015 - phan quyen nguoi khac hop le -> 200', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(businessUser()));
    const { req, res } = mockReqRes({ user: { id: 'admin1' }, params: { id: 'u2' }, body: { role: 'business' } });
    await adminUserController.updateUserRole(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('adminUser.controller.updateUserSubscriptionAndToken', () => {
  test('UTC016 - user khong ton tai -> 404', async () => {
    User.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 'u1' }, body: { plan: 'pro' } });
    await adminUserController.updateUserSubscriptionAndToken(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC017 - cap goi pro cho candidate -> gia han 30 ngay va reset usage', async () => {
    const user = freeCandidate();
    user.subscription.usage.cvReviewCount = 2;
    User.findById.mockReturnValue(mockQuery(user));

    const { req, res } = mockReqRes({ params: { id: 'u1' }, body: { plan: 'pro' } });
    await adminUserController.updateUserSubscriptionAndToken(req, res);

    expect(user.subscription.plan).toBe('pro');
    expect(user.subscription.usage.cvReviewCount).toBe(0);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  test('UTC018 - cong token cho business -> tang balance dung so luong', async () => {
    const biz = businessUser({ businessCredits: { balance: 100 } });
    User.findById.mockReturnValue(mockQuery(biz));

    const { req, res } = mockReqRes({ params: { id: 'u2' }, body: { addTokens: 50 } });
    await adminUserController.updateUserSubscriptionAndToken(req, res);

    expect(biz.businessCredits.balance).toBe(150);
  });

  test('UTC019 - tru token business vuot qua so du -> chan am, ve 0', async () => {
    const biz = businessUser({ businessCredits: { balance: 20 } });
    User.findById.mockReturnValue(mockQuery(biz));

    const { req, res } = mockReqRes({ params: { id: 'u2' }, body: { addTokens: -50 } });
    await adminUserController.updateUserSubscriptionAndToken(req, res);

    expect(biz.businessCredits.balance).toBe(0);
  });
});
