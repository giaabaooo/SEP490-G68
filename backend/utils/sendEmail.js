const nodemailer = require("nodemailer");

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, "")
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("sendEmail: Email credentials not configured, skipping send to", to);
      return false;
    }
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"Careerio Tuyển Dụng" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[sendEmail] Đã gửi email thành công tới ${to} (MessageId: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[sendEmail error] Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

module.exports = sendEmail;