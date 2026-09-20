jest.mock('../../../models/Notification');

const Notification = require('../../../models/Notification');
const { createNotification } = require('../../../utils/notificationHelper');

describe('notificationHelper.createNotification', () => {
  test('UTC001 - thieu userId -> tra ve null, khong goi Notification.create', async () => {
    const result = await createNotification({ title: 'T', message: 'M' });
    expect(result).toBeNull();
    expect(Notification.create).not.toHaveBeenCalled();
  });

  test('UTC002 - hop le -> trim title/message/link va tao notification', async () => {
    Notification.create.mockResolvedValue({ _id: '1' });
    await createNotification({ userId: 'u1', title: '  Tieu de  ', message: '  Noi dung  ', link: '  /link  ' });
    expect(Notification.create).toHaveBeenCalledWith({
      userId: 'u1', title: 'Tieu de', message: 'Noi dung', type: 'general', link: '/link', relatedApplicationId: null
    });
  });

  test('UTC003 - Notification.create nem loi -> nuot loi, tra ve null (khong lam sap he thong goi)', async () => {
    Notification.create.mockRejectedValue(new Error('DB down'));
    const result = await createNotification({ userId: 'u1', title: 'T', message: 'M' });
    expect(result).toBeNull();
  });

  test('UTC004 - truyen day du type/link/relatedApplicationId -> giu nguyen gia tri', async () => {
    Notification.create.mockResolvedValue({});
    await createNotification({ userId: 'u1', title: 'T', message: 'M', type: 'payment_success', link: '/x', relatedApplicationId: 'app1' });
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment_success', relatedApplicationId: 'app1' }));
  });
});
