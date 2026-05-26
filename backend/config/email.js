const nodemailer    = require("nodemailer");
const StoreSettings = require("../models/storeSettings");

// ============================
// CREATE TRANSPORTER
// Reads SMTP credentials from MongoDB (StoreSettings) instead of
// process.env, so the client can configure email from the setup wizard
// without touching Render environment variables.
// ============================
async function createTransporter() {
  const settings = await StoreSettings.findOne();

  const smtp = settings?.smtp;

  if (!smtp?.user || !smtp?.pass) {
    throw new Error(
      "SMTP is not configured. Please fill in the email settings in the store setup wizard."
    );
  }

  const port = Number(smtp.port || 587);

  return nodemailer.createTransport({
    host:   smtp.host || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });
}

// ============================
// SEND EMAIL
// ============================
async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject || (!html && !text)) {
    throw new Error("Missing required email fields: to, subject, html/text");
  }

  const settings    = await StoreSettings.findOne();
  const transporter = await createTransporter();
  const from        = settings?.smtp?.from || settings?.smtp?.user || "";

  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { sendEmail };