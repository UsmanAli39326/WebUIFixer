const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: process.env.SMTP_USER, // e.g., your_email@gmail.com
    pass: process.env.SMTP_PASS  // 16-character App Password (not your main password)
  }
});
async function sendPasswordResetEmail(toEmail, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@webfixer.com',
    to: toEmail,
    subject: 'Reset your WebUIFixer password',
    html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code expires in 15 minutes.</p>`
  });
}
module.exports = { sendPasswordResetEmail };
