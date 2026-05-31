const nodemailer = require('nodemailer');
const logger = require('../logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: process.env.SMTP_USER, // e.g., your_email@gmail.com
    pass: process.env.SMTP_PASS  // 16-character App Password (not your main password)
  }
});

async function sendPasswordResetEmail(toEmail, otp) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Email service not configured");
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@webfixer.com',
      to: toEmail,
      subject: 'Reset your WebUIFixer password',
      html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code expires in 15 minutes.</p>`
    });
  } catch (err) {
    logger.error('Email send failed:', err);
    throw err;
  }
}

async function sendVerificationEmail(toEmail, otp) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Email service not configured");
    }
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@webfixer.com',
      to: toEmail,
      subject: 'Verify your WebUIFixer email',
      html: `<p>Your email verification code is: <strong>${otp}</strong></p><p>This code expires in 24 hours.</p>`
    });
  } catch (err) {
    logger.error('Email send failed:', err);
    throw err;
  }
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
