jest.mock('../../../models/PracticeTopic');
jest.mock('../../../models/PracticeResult');

const PracticeTopic = require('../../../models/PracticeTopic');
const PracticeResult = require('../../../models/PracticeResult');
const practiceTopicController = require('../../../controllers/practiceTopic.controller');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { oid } = require('../../helpers/fixtures');

function topicFixture(overrides = {}) {
  return {
    _id: oid(),
    topicName: 'JavaScript Co Ban',
    questions: [
      { question: 'Q1', correctAnswer: 0 },
      { question: 'Q2', correctAnswer: 1 },
      { question: 'Q3', correctAnswer: 2 },
      { question: 'Q4', correctAnswer: 3 }
    ],
    save: jest.fn(),
    ...overrides
  };
}

describe('practiceTopic.controller.list/getById', () => {
  test('UTC001 - list tra ve danh sach chu de', async () => {
    PracticeTopic.find.mockReturnValue(mockQuery([topicFixture()]));
    const { req, res } = mockReqRes();
    await practiceTopicController.list(req, res);
    expect(res.statusCode).toBe(200);
  });

  test('UTC002 - getById khong ton tai -> 404', async () => {
    PracticeTopic.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 't1' } });
    await practiceTopicController.getById(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('practiceTopic.controller.create', () => {
  test('UTC003 - thieu topicName -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'mod1' }, body: {} });
    await practiceTopicController.create(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC004 - hop le -> tao voi gia tri mac dinh timeLimit=30, level=free, status=PUBLISHED', async () => {
    PracticeTopic.create.mockResolvedValue(topicFixture());
    const { req, res } = mockReqRes({ user: { id: 'mod1' }, body: { topicName: 'JS' } });
    await practiceTopicController.create(req, res);

    expect(PracticeTopic.create).toHaveBeenCalledWith(expect.objectContaining({
      topicName: 'JS', timeLimit: 30, level: 'free', status: 'PUBLISHED', createdBy: 'mod1'
    }));
    expect(res.statusCode).toBe(201);
  });
});

describe('practiceTopic.controller.update', () => {
  test('UTC005 - khong ton tai -> 404', async () => {
    PracticeTopic.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { id: 't1' }, body: {} });
    await practiceTopicController.update(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC006 - hop le -> cap nhat cac truong duoc gui, giu nguyen truong khong gui', async () => {
    const topic = topicFixture({ description: 'cu' });
    PracticeTopic.findById.mockResolvedValue(topic);
    const { req, res } = mockReqRes({ params: { id: 't1' }, body: { topicName: 'JS Nang Cao' } });
    await practiceTopicController.update(req, res);

    expect(topic.topicName).toBe('JS Nang Cao');
    expect(topic.description).toBe('cu');
    expect(topic.save).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});

describe('practiceTopic.controller.delete', () => {
  test('UTC007 - khong ton tai -> 404', async () => {
    PracticeTopic.findByIdAndDelete.mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { id: 't1' } });
    await practiceTopicController.delete(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC008 - hop le -> xoa thanh cong', async () => {
    PracticeTopic.findByIdAndDelete.mockResolvedValue(topicFixture());
    const { req, res } = mockReqRes({ params: { id: 't1' } });
    await practiceTopicController.delete(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('practiceTopic.controller.getMyHistory', () => {
  test('UTC009 - format lai du lieu giong cau truc Application Test', async () => {
    PracticeResult.find.mockReturnValue(mockQuery([
      { _id: 'r1', score: 80, duration: 100, answers: {}, createdAt: new Date(), practiceTopicId: { topicName: 'JS' } }
    ]));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await practiceTopicController.getMyHistory(req, res);

    const data = res._getJSONData();
    expect(data[0].testScore).toBe(80);
    expect(data[0].isPractice).toBe(true);
    expect(data[0].jobId.title).toBe('Bài tập: JS');
  });
});

describe('practiceTopic.controller.submitPractice', () => {
  test('UTC010 - chu de khong ton tai -> 404', async () => {
    PracticeTopic.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 't1' }, body: { answers: {} } });
    await practiceTopicController.submitPractice(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC011 - tra loi dung toan bo 4/4 -> score=100', async () => {
    PracticeTopic.findById.mockResolvedValue(topicFixture());
    PracticeResult.create.mockResolvedValue({ _id: oid(), createdAt: new Date() });

    const { req, res } = mockReqRes({
      user: { id: 'u1' }, params: { id: 't1' },
      body: { answers: { '0': 0, '1': 1, '2': 2, '3': 3 }, duration: 60 }
    });
    await practiceTopicController.submitPractice(req, res);

    expect(res._getJSONData().result.testScore).toBe(100);
    expect(res.statusCode).toBe(200);
  });

  test('UTC012 - tra loi dung 1/4 -> score=25', async () => {
    PracticeTopic.findById.mockResolvedValue(topicFixture());
    PracticeResult.create.mockResolvedValue({ _id: oid(), createdAt: new Date() });

    const { req, res } = mockReqRes({
      user: { id: 'u1' }, params: { id: 't1' },
      body: { answers: { '0': 0, '1': 9, '2': 9, '3': 9 }, duration: 60 }
    });
    await practiceTopicController.submitPractice(req, res);

    expect(res._getJSONData().result.testScore).toBe(25);
  });

  test('UTC013 - questions rong (total=0) -> score la NaN, JSON tra ve null (BUG, xem plan muc 9)', async () => {
    PracticeTopic.findById.mockResolvedValue(topicFixture({ questions: [] }));
    PracticeResult.create.mockResolvedValue({ _id: oid(), createdAt: new Date() });

    const { req, res } = mockReqRes({ user: { id: 'u1' }, params: { id: 't1' }, body: { answers: {} } });
    await practiceTopicController.submitPractice(req, res);

    expect(res._getJSONData().result.testScore).toBeNull();
  });
});
