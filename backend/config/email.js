const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // true only for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  return transporter.sendMail({
    from,
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };