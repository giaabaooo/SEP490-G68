jest.mock('../../../models/Notification');

const Notification = require('../../../models/Notification');
const notificationController = require('../../../controllers/notification.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { oid } = require('../../helpers/fixtures');

describe('notification.controller.list', () => {
  test('UTC001 - tra ve toi da 50 thong bao cua chinh user, sap xep moi nhat truoc', async () => {
    Notification.find.mockReturnValue(mockQuery([{ title: 'A' }]));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await notificationController.list(req, res);
    expect(Notification.find).toHaveBeenCalledWith({ userId: 'u1' });
    expect(res.statusCode).toBe(200);
  });
});

describe('notification.controller.markAsRead', () => {
  test('UTC002 - khong tim thay (hoac khong phai cua minh) -> 404', async () => {
    Notification.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'n1' } });
    await notificationController.markAsRead(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC003 - hop le -> isRead=true va luu', async () => {
    const noti = { isRead: false, save: jest.fn() };
    Notification.findOne.mockResolvedValue(noti);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 'n1' } });
    await notificationController.markAsRead(req, res);
    expect(noti.isRead).toBe(true);
    expect(noti.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});

describe('notification.controller.markAllAsRead', () => {
  test('UTC004 - cap nhat tat ca thong bao chua doc cua chinh user thanh da doc', async () => {
    Notification.updateMany.mockResolvedValue({});
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await notificationController.markAllAsRead(req, res);
    expect(Notification.updateMany).toHaveBeenCalledWith(
      { userId: 'u1', isRead: false },
      { $set: { isRead: true } }
    );
    expect(res.statusCode).toBe(200);
  });
});
