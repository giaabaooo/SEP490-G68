jest.mock('../../../models/CV');
jest.mock('../../../models/Application');
jest.mock('../../../utils/notificationHelper');

const CV = require('../../../models/CV');
const Application = require('../../../models/Application');
const { createNotification } = require('../../../utils/notificationHelper');
const cvController = require('../../../controllers/cvController');
const { mockReqRes } = require('../../helpers/mockReqRes');
const { mockQuery } = require('../../helpers/mockModel');
const { oid } = require('../../helpers/fixtures');

beforeEach(() => {
  createNotification.mockResolvedValue({});
});

describe('cvController.saveCV', () => {
  test('UTC001 - thieu fullName/email trong data.personal -> 400', async () => {
    const { req, res } = mockReqRes({ user: { id: 'u1' }, body: { data: { personal: {} } } });
    await cvController.saveCV(req, res);
    expect(res.statusCode).toBe(400);
  });

  test('UTC002 - khong co cvId -> tao moi CV', async () => {
    const savedCv = { _id: oid() };
    CV.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(savedCv), ...savedCv }));

    const { req, res } = mockReqRes({
      user: { id: 'u1' },
      body: { data: { personal: { fullName: 'A', email: 'a@a.com' } } }
    });
    await cvController.saveCV(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().message).toMatch(/thành công/);
  });

  test('UTC003 - co cvId -> cap nhat CV va thong bao cho NTD dang co application dung CV nay', async () => {
    CV.findOneAndUpdate.mockResolvedValue({ _id: 'cv1' });
    Application.find.mockReturnValue(mockQuery([
      { _id: oid(), jobId: { title: 'Backend Dev', recruiterId: oid() } }
    ]));

    const { req, res } = mockReqRes({
      user: { id: 'u1' },
      body: { cvId: 'cv1', data: { personal: { fullName: 'A', email: 'a@a.com' } } }
    });
    await cvController.saveCV(req, res);

    expect(CV.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'cv1', user: 'u1' }, expect.any(Object), { new: true });
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });
});

describe('cvController.getMyCVs', () => {
  test('UTC004 - tra ve danh sach CV cua user hien tai', async () => {
    CV.find.mockReturnValue(mockQuery([{ _id: 'cv1' }]));
    const { req, res } = mockReqRes({ user: { id: 'u1' } });
    await cvController.getMyCVs(req, res);
    expect(CV.find).toHaveBeenCalledWith({ user: 'u1' });
    expect(res.statusCode).toBe(200);
  });
});

describe('cvController.getCVById', () => {
  test('UTC005 - khong ton tai -> 404', async () => {
    CV.findById.mockReturnValue(mockQuery(null));
    const { req, res } = mockReqRes({ params: { id: 'cv1' } });
    await cvController.getCVById(req, res);
    expect(res.statusCode).toBe(404);
  });

  test('UTC006 - ton tai -> tra ve 200', async () => {
    CV.findById.mockReturnValue(mockQuery({ _id: 'cv1' }));
    const { req, res } = mockReqRes({ params: { id: 'cv1' } });
    await cvController.getCVById(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('cvController.renderCVView', () => {
  test('UTC007 - CV khong ton tai -> 404 kem trang HTML thong bao', async () => {
    CV.findById.mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { id: 'cv1' } });
    await cvController.renderCVView(req, res);
    expect(res.statusCode).toBe(404);
    expect(res._getData()).toMatch(/Không tìm thấy hồ sơ/);
  });

  test('UTC008 - du lieu chua ky tu HTML doc hai (<script>) -> phai duoc escape trong output', async () => {
    CV.findById.mockResolvedValue({
      title: 'CV cua toi',
      design: { font: 'Roboto', color: '#059669', lineSpacing: 1.5, layout: 'classic' },
      sectionOrder: ['objective'],
      data: {
        personal: { fullName: '<script>alert(1)</script>', email: 'a@a.com' },
        objective: 'Muc tieu nghe nghiep'
      }
    });
    const { req, res } = mockReqRes({ params: { id: 'cv1' } });
    await cvController.renderCVView(req, res);

    const html = res._getData();
    expect(html).not.toMatch(/<script>alert\(1\)<\/script>/);
    expect(html).toMatch(/&lt;script&gt;/);
    expect(res.statusCode).toBe(200);
  });

  test('UTC009 - layout 2-col voi day du du lieu -> render khong loi, status 200', async () => {
    CV.findById.mockResolvedValue({
      title: 'CV 2 cot',
      design: { font: 'Inter', color: '#111', lineSpacing: 1.4, layout: '2-col' },
      sectionOrder: ['experience', 'skills'],
      data: {
        personal: { fullName: 'Nguyen Van B', email: 'b@b.com', phone: '0900000000' },
        skills: 'Node.js, MongoDB',
        experience: [{ company: 'Acme', position: 'Dev', time: '2022-2024', description: 'Lam viec' }]
      }
    });
    const { req, res } = mockReqRes({ params: { id: 'cv1' } });
    await cvController.renderCVView(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getData()).toMatch(/Acme/);
  });
});
