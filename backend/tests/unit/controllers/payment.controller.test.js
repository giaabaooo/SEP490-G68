jest.mock('@payos/node');
jest.mock('../../../models/Transaction');
jest.mock('../../../models/User');
jest.mock('../../../utils/notificationHelper');

const PayOS = require('@payos/node');
const Transaction = require('../../../models/Transaction');
const User = require('../../../models/User');
const { createNotification } = require('../../../utils/notificationHelper');
const paymentController = require('../../../controllers/payment.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { freeCandidate, businessUser, proCandidate, oid } = require('../../helpers/fixtures');

// PayOS SDK duoc khoi tao mot lan duy nhat o module-scope cua controller
// (const payos = new PayOS(...)). Lay dung instance mock do de dieu khien.
const payosInstance = PayOS.mock.instances[0];

beforeEach(() => {
  createNotification.mockResolvedValue({});
  payosInstance.createPaymentLink.mockReset();
  payosInstance.verifyPaymentWebhookData.mockReset();
  payosInstance.getPaymentLinkInformation.mockReset();
});

describe('payment.controller.createPaymentLink', () => {
  test('UTC001 - user khong ton tai -> 404', async () => {
    User.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { planType: 'CANDIDATE_PRO', amount: 99000 } });
    await paymentController.createPaymentLink(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC002 - tao link thanh cong -> luu Transaction PENDING, tra checkoutUrl', async () => {
    User.findById.mockResolvedValue(freeCandidate());
    payosInstance.createPaymentLink.mockResolvedValue({ paymentLinkId: 'pl1', checkoutUrl: 'https://payos/checkout/1' });
    Transaction.create.mockResolvedValue({});

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { planType: 'CANDIDATE_PRO', amount: 99000 } });
    await paymentController.createPaymentLink(req, res);

    expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING', planType: 'CANDIDATE_PRO' }));
    expect(res._getJSONData().checkoutUrl).toBe('https://payos/checkout/1');
    expect(res.statusCode).toBe(200);
  });

  test('UTC003 - PayOS SDK loi -> 500', async () => {
    User.findById.mockResolvedValue(freeCandidate());
    payosInstance.createPaymentLink.mockRejectedValue(new Error('PayOS down'));

    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { planType: 'CANDIDATE_PRO', amount: 99000 } });
    await paymentController.createPaymentLink(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('payment.controller.handleWebhook', () => {
  test('UTC004 - code khac "00" -> khong kich hoat gi, van tra 200 cho PayOS', async () => {
    payosInstance.verifyPaymentWebhookData.mockReturnValue({ code: '01', orderCode: 123 });
    const { req, res } = mockReqRes({ body: {} });
    await paymentController.handleWebhook(req, res);
    expect(Transaction.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  test('UTC005 - code "00" nhung giao dich da duoc xu ly truoc do (khong con PENDING) -> khong cong don lai', async () => {
    payosInstance.verifyPaymentWebhookData.mockReturnValue({ code: '00', orderCode: 123 });
    Transaction.findOneAndUpdate.mockResolvedValue(null);
    const { req, res } = mockReqRes({ body: {} });
    await paymentController.handleWebhook(req, res);
    expect(User.findById).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  test('UTC006 - CANDIDATE_PRO thanh cong -> nang cap pro 30 ngay, reset usage, tra 200', async () => {
    payosInstance.verifyPaymentWebhookData.mockReturnValue({ code: '00', orderCode: 123 });
    Transaction.findOneAndUpdate.mockResolvedValue({ userId: 'u1', planType: 'CANDIDATE_PRO' });
    const user = freeCandidate();
    User.findById.mockResolvedValue(user);

    const { req, res } = mockReqRes({ body: {} });
    await paymentController.handleWebhook(req, res);

    expect(user.subscription.plan).toBe('pro');
    expect(user.subscription.usage.cvReviewCount).toBe(0);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment_success' }));
    expect(res.statusCode).toBe(200);
  });

  test('UTC007 - CANDIDATE_PRO da co han con hieu luc -> cong don them 30 ngay tu endDate cu', async () => {
    payosInstance.verifyPaymentWebhookData.mockReturnValue({ code: '00', orderCode: 123 });
    Transaction.findOneAndUpdate.mockResolvedValue({ userId: 'u1', planType: 'CANDIDATE_PRO' });
    const user = proCandidate();
    const oldEndDate = new Date(user.subscription.endDate);
    User.findById.mockResolvedValue(user);

    const { req, res } = mockReqRes({ body: {} });
    await paymentController.handleWebhook(req, res);

    const expected = new Date(oldEndDate);
    expected.setDate(expected.getDate() + 30);
    expect(user.subscription.endDate.getTime()).toBe(expected.getTime());
  });

  test('UTC008 - BUSINESS_TOPUP thanh cong -> cong token vao balance', async () => {
    payosInstance.verifyPaymentWebhookData.mockReturnValue({ code: '00', orderCode: 123 });
    Transaction.findOneAndUpdate.mockResolvedValue({ userId: 'u1', planType: 'BUSINESS_TOPUP', tokensAdded: 500 });
    const biz = businessUser({ businessCredits: { balance: 100 } });
    User.findById.mockResolvedValue(biz);

    const { req, res } = mockReqRes({ body: {} });
    await paymentController.handleWebhook(req, res);

    expect(biz.businessCredits.balance).toBe(600);
    expect(res.statusCode).toBe(200);
  });

  test('UTC009 - verifyPaymentWebhookData throw (chu ky sai) -> 400', async () => {
    payosInstance.verifyPaymentWebhookData.mockImplementation(() => { throw new Error('invalid signature'); });
    const { req, res } = mockReqRes({ body: {} });
    await paymentController.handleWebhook(req, res);
    expect(res.statusCode).toBe(400);
  });
});

describe('payment.controller.checkPaymentStatus', () => {
  test('UTC010 - giao dich khong ton tai -> 404', async () => {
    Transaction.findOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ query: { orderCode: '123' } });
    await paymentController.checkPaymentStatus(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC011 - giao dich da PAID san -> tra ve PAID ngay, khong goi PayOS', async () => {
    Transaction.findOne.mockResolvedValue({ status: 'PAID', orderCode: 123 });
    const { req, res } = mockReqRes({ query: { orderCode: '123' } });
    await paymentController.checkPaymentStatus(req, res);
    expect(payosInstance.getPaymentLinkInformation).not.toHaveBeenCalled();
    expect(res._getJSONData().status).toBe('PAID');
  });

  test('UTC012 - PayOS bao PAID, atomic update thanh cong -> kich hoat goi va tra PAID', async () => {
    Transaction.findOne.mockResolvedValue({ status: 'PENDING', orderCode: 123 });
    payosInstance.getPaymentLinkInformation.mockResolvedValue({ status: 'PAID' });
    Transaction.findOneAndUpdate.mockResolvedValue({ userId: 'u1', planType: 'BUSINESS_TOPUP', tokensAdded: 50 });
    const biz = businessUser({ businessCredits: { balance: 0 } });
    User.findById.mockResolvedValue(biz);

    const { req, res } = mockReqRes({ query: { orderCode: '123' } });
    await paymentController.checkPaymentStatus(req, res);

    expect(biz.businessCredits.balance).toBe(50);
    expect(res._getJSONData().status).toBe('PAID');
  });

  test('UTC013 - PayOS bao PAID nhung Webhook da xu ly truoc (atomic update tra null) -> khong cong don lai', async () => {
    Transaction.findOne.mockResolvedValue({ status: 'PENDING', orderCode: 123 });
    payosInstance.getPaymentLinkInformation.mockResolvedValue({ status: 'PAID' });
    Transaction.findOneAndUpdate.mockResolvedValue(null);

    const { req, res } = mockReqRes({ query: { orderCode: '123' } });
    await paymentController.checkPaymentStatus(req, res);

    expect(User.findById).not.toHaveBeenCalled();
    expect(res._getJSONData().message).toMatch(/Webhook/);
  });

  test('UTC014 - PayOS van bao PENDING -> tra ve status hien tai', async () => {
    Transaction.findOne.mockResolvedValue({ status: 'PENDING', orderCode: 123 });
    payosInstance.getPaymentLinkInformation.mockResolvedValue({ status: 'PENDING' });

    const { req, res } = mockReqRes({ query: { orderCode: '123' } });
    await paymentController.checkPaymentStatus(req, res);
    expect(res._getJSONData()).toEqual({ status: 'PENDING' });
  });
});

describe('payment.controller.getUserUsageInfo', () => {
  test('UTC015 - user khong ton tai -> 404', async () => {
    User.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await paymentController.getUserUsageInfo(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC016 - candidate pro nhung da qua endDate -> tu dong ha ve free va luu lai', async () => {
    const expiredUser = proCandidate({ role: 'candidate' });
    expiredUser.subscription.endDate = new Date(Date.now() - 1000);
    User.findById.mockReturnValue(mockQuery(expiredUser));

    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await paymentController.getUserUsageInfo(req, res);

    expect(expiredUser.subscription.plan).toBe('free');
    expect(expiredUser.save).toHaveBeenCalledTimes(1);
  });

  test('UTC017 - candidate pro con han -> giu nguyen plan pro', async () => {
    const activeUser = proCandidate({ role: 'candidate' });
    User.findById.mockReturnValue(mockQuery(activeUser));

    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await paymentController.getUserUsageInfo(req, res);

    expect(activeUser.subscription.plan).toBe('pro');
    expect(activeUser.save).not.toHaveBeenCalled();
  });
});

describe('payment.controller.getAllTransactions', () => {
  test('UTC018 - khong phai admin -> 403', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1', role: 'business' } });
    await paymentController.getAllTransactions(req, res);
    expect(res.statusCode).toBe(403);
  });

  test('UTC019 - admin -> tra ve danh sach giao dich phan trang', async () => {
    Transaction.find.mockReturnValue(mockQuery([{ orderCode: 1 }]));
    Transaction.countDocuments.mockResolvedValue(1);

    const { req, res } = mockReqRes({ user: { id: 'admin1', role: 'admin' }, query: {} });
    await paymentController.getAllTransactions(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().pagination.total).toBe(1);
  });
});
