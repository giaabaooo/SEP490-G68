const nodemailer = require("nodemailer");

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, "")
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("sendEmail: Email credentials not configured, skipping send to", to);
      return;
    }
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Careerio Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error(`[sendEmail error] Failed to send email to ${to}:`, err.message);
  }
};

module.exports = sendEmail;