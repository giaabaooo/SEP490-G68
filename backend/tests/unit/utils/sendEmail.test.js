jest.mock('nodemailer');

const nodemailer = require('nodemailer');
const sendMailMock = jest.fn().mockResolvedValue({ messageId: '1' });
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

const sendEmail = require('../../../utils/sendEmail');

describe('sendEmail', () => {
  test('UTC001 - goi transporter.sendMail voi dung to/subject/html va from = EMAIL_USER', async () => {
    await sendEmail('a@a.com', 'Chu de', '<p>Noi dung</p>');
    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL_USER,
      to: 'a@a.com',
      subject: 'Chu de',
      html: '<p>Noi dung</p>'
    });
  });

  test('UTC002 - transporter loi (SMTP tu choi) -> loi duoc lan truyen ra ngoai', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP rejected'));
    await expect(sendEmail('a@a.com', 'S', 'H')).rejects.toThrow('SMTP rejected');
  });
});
