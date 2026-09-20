jest.mock('../../../models/User');
jest.mock('../../../models/Otp');
jest.mock('../../../models/Job');
jest.mock('../../../utils/sendEmail');
jest.mock('bcryptjs');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const Otp = require('../../../models/Otp');
const Job = require('../../../models/Job');
const sendEmail = require('../../../utils/sendEmail');
const authController = require('../../../controllers/auth.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { freeCandidate, businessUser, oid } = require('../../helpers/fixtures');
const { mockQuery } = require('../../helpers/mockModel');

describe('auth.controller.register', () => {
  test('UTC001 - role khong hop le -> 400', async () => {
    const { req, res } = mockReqRes({ body: { role: 'admin', email: 'a@b.com', password: '123456' } });
    await authController.register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/Role/);
  });

  test('UTC002 - email da ton tai -> 400', async () => {
    User.findOne.mockResolvedValue(freeCandidate());
    const { req, res } = mockReqRes({ body: { role: 'candidate', email: 'a@b.com', password: '123456' } });
    await authController.register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/tồn tại/);
  });

  test('UTC003 - hop le -> tao OTP, gui email, tra 201', async () => {
    User.findOne.mockResolvedValue(null);
    Otp.deleteMany.mockResolvedValue({});
    Otp.create.mockResolvedValue({});
    bcrypt.hash.mockResolvedValue('hashed-pass');
    sendEmail.mockResolvedValue({});

    const { req, res } = mockReqRes({ body: { fullName: 'A', role: 'candidate', email: 'a@b.com', password: '123456' } });
    await authController.register(req, res);

    expect(Otp.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'a@b.com',
      data: expect.objectContaining({ password: 'hashed-pass', role: 'candidate' })
    }));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
  });

  test('UTC004 - role business, co companyName -> data.companyName duoc gan', async () => {
    User.findOne.mockResolvedValue(null);
    Otp.deleteMany.mockResolvedValue({});
    Otp.create.mockResolvedValue({});
    bcrypt.hash.mockResolvedValue('hashed-pass');
    sendEmail.mockResolvedValue({});

    const { req, res } = mockReqRes({ body: { fullName: 'B', role: 'business', companyName: 'Acme', email: 'b@b.com', password: '123456' } });
    await authController.register(req, res);

    expect(Otp.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ companyName: 'Acme', role: 'business' })
    }));
  });
});

describe('auth.controller.verifyOtp', () => {
  test('UTC005 - otp khong ton tai -> 400', async () => {
    Otp.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: { email: 'a@b.com', otp: '000000' } });
    await authController.verifyOtp(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC006 - otp hop le -> tao user, xoa otp, tra token', async () => {
    const otpRecord = { _id: oid(), data: { fullName: 'A', email: 'a@b.com', role: 'candidate' } };
    Otp.findOne.mockResolvedValue(otpRecord);
    Otp.deleteOne.mockResolvedValue({});
    const createdUser = freeCandidate({ email: 'a@b.com' });
    User.create.mockResolvedValue(createdUser);

    const { req, res } = mockReqRes({ body: { email: 'a@b.com', otp: '123456' } });
    await authController.verifyOtp(req, res);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ isVerified: true, status: 'active' }));
    expect(Otp.deleteOne).toHaveBeenCalledWith({ _id: otpRecord._id });
    const data = res._getJSONData();
    expect(data.token).toBeDefined();
    expect(jwt.verify(data.token, process.env.JWT_SECRET)).toMatchObject({ id: createdUser._id });
  });
});

describe('auth.controller.forgotPassword', () => {
  test('UTC007 - thieu email -> 400', async () => {
    const { req, res } = mockReqRes({ body: {} });
    await authController.forgotPassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC008 - khong tim thay user -> 400', async () => {
    User.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: { email: 'x@x.com' } });
    await authController.forgotPassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC009 - hop le -> tao Otp voi purpose reset-password, gui email', async () => {
    User.findOne.mockResolvedValue(freeCandidate({ email: 'x@x.com' }));
    Otp.deleteMany.mockResolvedValue({});
    Otp.create.mockResolvedValue({});
    sendEmail.mockResolvedValue({});

    const { req, res } = mockReqRes({ body: { email: 'X@X.com' } });
    await authController.forgotPassword(req, res);

    expect(Otp.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'x@x.com',
      data: { purpose: 'reset-password' }
    }));
    expect(res.statusCode).toBe(200);
  });
});

describe('auth.controller.verifyResetOtp', () => {
  test('UTC010 - thieu email/otp -> 400', async () => {
    const { req, res } = mockReqRes({ body: { email: 'x@x.com' } });
    await authController.verifyResetOtp(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC011 - otp khong hop le -> 400', async () => {
    Otp.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: { email: 'x@x.com', otp: '000000' } });
    await authController.verifyResetOtp(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC012 - hop le -> xoa otp, tra 200', async () => {
    Otp.findOne.mockResolvedValue({ _id: oid() });
    Otp.deleteOne.mockResolvedValue({});
    const { req, res } = mockReqRes({ body: { email: 'X@X.com', otp: '123456' } });
    await authController.verifyResetOtp(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().email).toBe('x@x.com');
  });
});

describe('auth.controller.resetPassword', () => {
  test('UTC013 - thieu email/password -> 400', async () => {
    const { req, res } = mockReqRes({ body: { email: 'x@x.com' } });
    await authController.resetPassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC014 - password < 6 ky tu -> 400', async () => {
    const { req, res } = mockReqRes({ body: { email: 'x@x.com', password: '123' } });
    await authController.resetPassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC015 - user khong ton tai -> 400', async () => {
    User.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: { email: 'x@x.com', password: '123456' } });
    await authController.resetPassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC016 - hop le -> hash password moi, save, tra token', async () => {
    const user = freeCandidate({ email: 'x@x.com' });
    User.findOne.mockResolvedValue(user);
    bcrypt.hash.mockResolvedValue('new-hash');

    const { req, res } = mockReqRes({ body: { email: 'X@X.com', password: '123456' } });
    await authController.resetPassword(req, res);

    expect(user.password).toBe('new-hash');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res._getJSONData().token).toBeDefined();
  });
});

describe('auth.controller.login', () => {
  test('UTC017 - thieu email/password -> 400', async () => {
    const { req, res } = mockReqRes({ body: { email: 'a@b.com' } });
    await authController.login(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC018 - user khong ton tai -> 400', async () => {
    User.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: '123456' } });
    await authController.login(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC019 - sai mat khau -> 400', async () => {
    User.findOne.mockResolvedValue(freeCandidate({ password: 'hashed' }));
    bcrypt.compare.mockResolvedValue(false);
    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: 'wrong' } });
    await authController.login(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC020 - tai khoan banned -> 403', async () => {
    User.findOne.mockResolvedValue(freeCandidate({ password: 'hashed', status: 'banned' }));
    bcrypt.compare.mockResolvedValue(true);
    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: '123456' } });
    await authController.login(req, res);
    expect(res.statusCode).toBe(403);
    expect(res._getJSONData().message).toMatch(/khóa/);
  });

  test('UTC021 - tai khoan pending -> 403', async () => {
    User.findOne.mockResolvedValue(freeCandidate({ password: 'hashed', status: 'pending' }));
    bcrypt.compare.mockResolvedValue(true);
    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: '123456' } });
    await authController.login(req, res);
    expect(res.statusCode).toBe(403);
    expect(res._getJSONData().message).toMatch(/chờ xác nhận/);
  });

  test('UTC022 - dang nhap thanh cong, khong phai moderator duoc phan cong -> 200, khong doi role', async () => {
    const user = freeCandidate({ password: 'hashed', status: 'active' });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    Job.exists.mockResolvedValue(null);

    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: '123456' } });
    await authController.login(req, res);

    expect(res.statusCode).toBe(200);
    expect(user.role).toBe('candidate');
    expect(user.save).not.toHaveBeenCalled();
    expect(res._getJSONData().token).toBeDefined();
  });

  test('UTC023 - email duoc phan cong lam moderator trong Job -> tu dong nang subRole len moderator', async () => {
    const user = freeCandidate({ password: 'hashed', status: 'active', role: 'candidate', subRole: '' });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    Job.exists.mockResolvedValue({ _id: oid() });

    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: '123456' } });
    await authController.login(req, res);

    expect(user.role).toBe('business');
    expect(user.subRole).toBe('moderator');
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test('UTC024 - user da la admin -> khong check/nang subRole moderator', async () => {
    const user = freeCandidate({ password: 'hashed', status: 'active', role: 'admin', subRole: 'admin' });
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);

    const { req, res } = mockReqRes({ body: { email: 'a@b.com', password: '123456' } });
    await authController.login(req, res);

    expect(Job.exists).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});

describe('auth.controller.changePassword', () => {
  test('UTC025 - thieu currentPassword/newPassword -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { currentPassword: 'x' } });
    await authController.changePassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC026 - newPassword < 6 ky tu -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { currentPassword: 'x', newPassword: '123' } });
    await authController.changePassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC027 - user khong ton tai -> 404', async () => {
    User.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { currentPassword: 'x', newPassword: '123456' } });
    await authController.changePassword(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC028 - user dang nhap bang Google, chua co password -> 400', async () => {
    User.findById.mockResolvedValue(freeCandidate({ password: undefined }));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { currentPassword: 'x', newPassword: '123456' } });
    await authController.changePassword(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/chưa có mật khẩu/);
  });

  test('UTC029 - sai mat khau hien tai -> 400', async () => {
    User.findById.mockResolvedValue(freeCandidate({ password: 'hashed' }));
    bcrypt.compare.mockResolvedValue(false);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { currentPassword: 'wrong', newPassword: '123456' } });
    await authController.changePassword(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC030 - hop le -> hash mat khau moi, save, tra 200', async () => {
    const user = freeCandidate({ password: 'hashed' });
    User.findById.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('new-hash');

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { currentPassword: 'old', newPassword: '123456' } });
    await authController.changePassword(req, res);

    expect(user.password).toBe('new-hash');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});

describe('auth.controller.googleLogin', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  test('UTC031 - thieu token -> 400', async () => {
    const { req, res } = mockReqRes({ body: {} });
    await authController.googleLogin(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC032 - goi Google API that bai (network error) -> 400', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const { req, res } = mockReqRes({ body: { token: 'gg-token' } });
    await authController.googleLogin(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/Failed to fetch/);
  });

  test('UTC033 - Google tra ve response khong ok -> 400 Invalid or expired token', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const { req, res } = mockReqRes({ body: { token: 'gg-token' } });
    await authController.googleLogin(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/Invalid or expired/);
  });

  test('UTC034 - user Google da ton tai va active -> dang nhap thanh cong, khong tao user moi', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'g@g.com', name: 'G User', id: 'gid1' })
    });
    const existingUser = freeCandidate({ email: 'g@g.com', googleId: 'gid1', status: 'active' });
    User.findOne.mockResolvedValue(existingUser);
    Job.exists.mockResolvedValue(null);

    const { req, res } = mockReqRes({ body: { token: 'gg-token' } });
    await authController.googleLogin(req, res);

    expect(User.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().isNewUser).toBe(false);
  });

  test('UTC035 - user Google da ton tai nhung bi banned -> 403', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'g@g.com', name: 'G User', id: 'gid1' })
    });
    User.findOne.mockResolvedValue(freeCandidate({ email: 'g@g.com', googleId: 'gid1', status: 'banned' }));

    const { req, res } = mockReqRes({ body: { token: 'gg-token' } });
    await authController.googleLogin(req, res);
    expect(res.statusCode).toBe(403);
  });

  test('UTC036 - email Google chua co tai khoan, khong duoc gan lam moderator -> yeu cau onboarding', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'new@g.com', name: 'New User', id: 'gid2' })
    });
    User.findOne.mockResolvedValue(null);
    Job.exists.mockResolvedValue(null);

    const { req, res } = mockReqRes({ body: { token: 'gg-token' } });
    await authController.googleLogin(req, res);

    expect(User.create).not.toHaveBeenCalled();
    expect(res._getJSONData().isNewUser).toBe(true);
    expect(res._getJSONData().tempToken).toBeDefined();
  });

  test('UTC037 - email Google duoc HR chi dinh lam moderator -> tao tai khoan moderator ngay', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'mod@g.com', name: 'Mod User', id: 'gid3' })
    });
    User.findOne.mockResolvedValue(null);
    Job.exists.mockResolvedValue({ _id: oid() });
    const createdMod = freeCandidate({ email: 'mod@g.com', role: 'business', subRole: 'moderator' });
    User.create.mockResolvedValue(createdMod);

    const { req, res } = mockReqRes({ body: { token: 'gg-token' } });
    await authController.googleLogin(req, res);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'business', subRole: 'moderator' }));
    expect(res._getJSONData().isNewUser).toBe(false);
  });
});

describe('auth.controller.updateRole', () => {
  test('UTC038 - cap nhat role candidate -> khong gan companyName', async () => {
    const updated = freeCandidate({ role: 'candidate' });
    User.findByIdAndUpdate.mockReturnValue(mockQuery(updated));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { role: 'candidate', phone: '0900000000' } });
    await authController.updateRole(req, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { $set: { role: 'candidate', phone: '0900000000' } }, expect.any(Object));
    expect(res.statusCode).toBe(200);
  });

  test('UTC039 - cap nhat role business kem companyName -> gan companyName vao updateData', async () => {
    const updated = businessUser();
    User.findByIdAndUpdate.mockReturnValue(mockQuery(updated));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { role: 'business', companyName: 'Acme' } });
    await authController.updateRole(req, res);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { $set: { role: 'business', companyName: 'Acme' } }, expect.any(Object));
  });
});

describe('auth.controller.acceptInvite', () => {
  test('UTC040 - thieu token/password -> 400', async () => {
    const { req, res } = mockReqRes({ body: { token: 'x' } });
    await authController.acceptInvite(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC041 - password qua ngan -> 400', async () => {
    const { req, res } = mockReqRes({ body: { token: 'x', password: '123' } });
    await authController.acceptInvite(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC042 - loi moi khong ton tai trong DB -> 400', async () => {
    const inviteToken = jwt.sign({ email: 'mod@x.com', role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET);
    Otp.findOne.mockResolvedValue(null);

    const { req, res } = mockReqRes({ body: { token: inviteToken, password: '123456' } });
    await authController.acceptInvite(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/không tồn tại/);
  });

  test('UTC043 - token het han -> 400 "qua 7 ngay"', async () => {
    const expiredToken = jwt.sign({ email: 'mod@x.com' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const { req, res } = mockReqRes({ body: { token: expiredToken, password: '123456' } });
    await authController.acceptInvite(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toMatch(/hết hạn/);
  });

  test('UTC044 - user da ton tai -> cap nhat mat khau va nang len moderator', async () => {
    const inviteToken = jwt.sign({ email: 'mod@x.com', role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET);
    Otp.findOne.mockResolvedValue({ _id: oid() });
    Otp.deleteOne.mockResolvedValue({});
    bcrypt.hash.mockResolvedValue('hashed-pw');
    const existingUser = freeCandidate({ email: 'mod@x.com', role: 'candidate' });
    User.findOne.mockResolvedValue(existingUser);

    const { req, res } = mockReqRes({ body: { token: inviteToken, password: '123456' } });
    await authController.acceptInvite(req, res);

    expect(existingUser.role).toBe('business');
    expect(existingUser.subRole).toBe('moderator');
    expect(existingUser.status).toBe('active');
    expect(res.statusCode).toBe(200);
  });

  test('UTC045 - chua co user -> tao tai khoan moderator moi', async () => {
    const inviteToken = jwt.sign({ email: 'newmod@x.com', role: 'business', subRole: 'moderator' }, process.env.JWT_SECRET);
    Otp.findOne.mockResolvedValue({ _id: oid() });
    Otp.deleteOne.mockResolvedValue({});
    bcrypt.hash.mockResolvedValue('hashed-pw');
    User.findOne.mockResolvedValue(null);
    const createdUser = freeCandidate({ email: 'newmod@x.com', role: 'business', subRole: 'moderator' });
    User.create.mockResolvedValue(createdUser);

    const { req, res } = mockReqRes({ body: { token: inviteToken, password: '123456' } });
    await authController.acceptInvite(req, res);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'newmod@x.com', role: 'business', subRole: 'moderator' }));
    expect(res.statusCode).toBe(200);
  });
});
