const nodemailer = require("nodemailer");

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, "")
    }
  });
};

const sendEmail = async (to, subject, html) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Careerio Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

module.exports = sendEmail;