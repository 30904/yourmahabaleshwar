import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!process.env.SMTP_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return { mock: true };
  }
  return transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};
