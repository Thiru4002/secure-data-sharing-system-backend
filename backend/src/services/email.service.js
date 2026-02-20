const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS is not configured');
    }
    if (!to || !subject || !html) {
      throw new Error('Email payload is incomplete');
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log(`[email] Sent to ${to} | subject: ${subject} | id: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[email] Failed to send to ${to || 'unknown'} | ${err.message}`);
    throw err;
  }
};

// Example usage:
// await sendEmail({
//   to: user.email,
//   subject: 'Consent Approved',
//   html: '<p>Your consent request has been approved.</p>',
// });

module.exports = { sendEmail };
