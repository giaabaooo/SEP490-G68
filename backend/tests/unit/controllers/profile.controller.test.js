jest.mock('../../../models/User');

const User = require('../../../models/User');
const profileController = require('../../../controllers/profile.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { freeCandidate } = require('../../helpers/fixtures');

describe('profile.controller.getProfile', () => {
  test('UTC001 - user khong ton tai -> 404', async () => {
    User.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await profileController.getProfile(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC002 - tra ve profile, khong lo password (select "-password")', async () => {
    User.findById.mockReturnValue(mockQuery(freeCandidate()));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await profileController.getProfile(req, res);
    expect(User.findById.mock.calls[0][0]).toBe('u1');
    expect(res.statusCode).toBe(200);
  });
});

describe('profile.controller.updateProfile', () => {
  test('UTC003 - user khong ton tai -> 404', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { fullName: 'B' } });
    await profileController.updateProfile(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC004 - gui kem field email -> API bo qua, khong duoc phep doi email', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(freeCandidate()));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { fullName: 'B', email: 'hacked@x.com' } });
    await profileController.updateProfile(req, res);

    const updateData = User.findByIdAndUpdate.mock.calls[0][1].$set;
    expect(updateData.email).toBeUndefined();
    expect(updateData.fullName).toBe('B');
  });

  test('UTC005 - chi cap nhat field duoc gui, khong dong cham field khac', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(freeCandidate()));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { phone: '0900000000' } });
    await profileController.updateProfile(req, res);

    const updateData = User.findByIdAndUpdate.mock.calls[0][1].$set;
    expect(Object.keys(updateData)).toEqual(['phone']);
    expect(res.statusCode).toBe(200);
  });
});

describe('profile.controller.uploadAvatar', () => {
  test('UTC006 - khong co file -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await profileController.uploadAvatar(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC007 - user khong ton tai -> 404', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, file: { filename: 'avt.png' } });
    await profileController.uploadAvatar(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC008 - hop le -> luu duong dan /uploads/avatars/<filename>', async () => {
    User.findByIdAndUpdate.mockReturnValue(mockQuery(freeCandidate()));
    const { req, res } = mockReqRes({ user: { id: 'u1' }, file: { filename: 'avt.png' } });
    await profileController.uploadAvatar(req, res);

    expect(res._getJSONData().avatarUrl).toBe('/uploads/avatars/avt.png');
    const updateData = User.findByIdAndUpdate.mock.calls[0][1].$set;
    expect(updateData.avatar).toBe('/uploads/avatars/avt.png');
    expect(res.statusCode).toBe(200);
  });
});
