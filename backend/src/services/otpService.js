import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import { sendSMS } from './smsService.js';
import { sendEmail } from './emailService.js';

const OTP_TTL_MS = 10 * 60 * 1000;

export const generateOtpCode = () => String(crypto.randomInt(100000, 999999));

export const createAndSendOtp = async ({
  identifier,
  channel,
  purpose,
  userId,
  phone,
  email,
}) => {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const normalized = String(identifier).trim().toLowerCase();

  await Otp.updateMany(
    { identifier: normalized, purpose, consumed: false },
    { consumed: true }
  );

  const otp = await Otp.create({
    identifier: normalized,
    channel,
    purpose,
    codeHash,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    user: userId,
  });

  const message = `Your YOURMAHABALESHWAR OTP is ${code}. Valid for 10 minutes. Do not share.`;

  if (channel === 'PHONE') {
    await sendSMS({ phone: phone || normalized, message, userId });
  } else {
    await sendEmail({
      to: email || normalized,
      subject: 'OTP Verification - YOURMAHABALESHWAR.COM',
      html: `<p>${message}</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>`,
    });
  }

  const payload = { otpId: otp._id, expiresAt: otp.expiresAt, channel, purpose };
  if (process.env.NODE_ENV !== 'production') {
    payload.devCode = code;
  }
  return payload;
};

export const verifyOtpCode = async ({ identifier, purpose, code }) => {
  const normalized = String(identifier).trim().toLowerCase();
  const otp = await Otp.findOne({
    identifier: normalized,
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
  })
    .select('+codeHash')
    .sort('-createdAt');

  if (!otp) {
    return { ok: false, message: 'OTP expired or not found' };
  }

  if (otp.attempts >= otp.maxAttempts) {
    otp.consumed = true;
    await otp.save();
    return { ok: false, message: 'Too many attempts. Request a new OTP.' };
  }

  const match = await otp.matchCode(code);
  otp.attempts += 1;
  if (!match) {
    await otp.save();
    return { ok: false, message: 'Invalid OTP' };
  }

  otp.consumed = true;
  await otp.save();
  return { ok: true, otp };
};
