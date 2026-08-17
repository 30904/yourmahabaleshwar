import crypto from 'crypto';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { success, error } from '../utils/apiResponse.js';
import { sendEmail } from '../services/emailService.js';
import { createAndSendOtp, verifyOtpCode } from '../services/otpService.js';
import { createNotification } from '../services/notificationService.js';

const ADMIN_PASSWORD_ROLES = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.OFFICE_STAFF_HOTEL,
  ROLES.OFFICE_STAFF_GUIDE,
]);

const sendTokens = (user, res, message = 'Login successful') => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const userObj = user.toObject();
  delete userObj.password;
  return success(res, { user: userObj, accessToken, refreshToken }, message);
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (await User.findOne({ email })) return error(res, 'Email already registered', 400);
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role && Object.values(ROLES).includes(role) ? role : ROLES.CUSTOMER,
    });

    const channel = phone ? 'PHONE' : 'EMAIL';
    const identifier = phone || email;
    const otpPayload = await createAndSendOtp({
      identifier,
      channel,
      purpose: 'SIGNUP',
      userId: user._id,
      phone,
      email,
    });

    await createNotification({
      userId: user._id,
      title: 'Welcome to YOURMAHABALESHWAR',
      message: 'Your account was created. Please verify with the OTP sent to you.',
      type: 'SYSTEM',
      email,
      sendMail: true,
    });

    return success(
      res,
      {
        userId: user._id,
        email: user.email,
        phone: user.phone,
        requiresOtp: true,
        ...otpPayload,
      },
      'Registered. OTP sent for verification.',
      201
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.matchPassword(password))) {
      return error(res, 'Invalid credentials', 401);
    }
    if (user.isActive === false) {
      return error(res, 'Account is inactive. Contact support.', 403);
    }

    if (ADMIN_PASSWORD_ROLES.has(user.role)) {
      user.refreshToken = signRefreshToken(user._id);
      await user.save({ validateBeforeSave: false });
      return sendTokens(user, res);
    }

    const channel = user.phone ? 'PHONE' : 'EMAIL';
    const identifier = user.phone || user.email;
    const otpPayload = await createAndSendOtp({
      identifier,
      channel,
      purpose: 'LOGIN',
      userId: user._id,
      phone: user.phone,
      email: user.email,
    });

    return success(
      res,
      {
        userId: user._id,
        email: user.email,
        phone: user.phone,
        requiresOtp: true,
        ...otpPayload,
      },
      'OTP sent. Verify to complete login.'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { identifier, channel, purpose = 'LOGIN', phone, email } = req.body;
    if (!identifier || !channel) return error(res, 'identifier and channel required', 400);
    if (!['PHONE', 'EMAIL'].includes(channel)) return error(res, 'Invalid channel', 400);
    if (!['LOGIN', 'SIGNUP', 'VERIFY'].includes(purpose)) return error(res, 'Invalid purpose', 400);

    let user = null;
    if (channel === 'EMAIL') {
      user = await User.findOne({ email: String(identifier).toLowerCase() });
    } else {
      user = await User.findOne({ phone: identifier });
    }

    if (purpose === 'LOGIN' && !user) {
      return error(res, 'No account found for this identifier', 404);
    }
    if (purpose === 'LOGIN' && user?.isActive === false) {
      return error(res, 'Account is inactive. Contact support.', 403);
    }

    const otpPayload = await createAndSendOtp({
      identifier,
      channel,
      purpose,
      userId: user?._id,
      phone: phone || (channel === 'PHONE' ? identifier : user?.phone),
      email: email || (channel === 'EMAIL' ? identifier : user?.email),
    });

    return success(res, otpPayload, 'OTP sent');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { identifier, purpose = 'LOGIN', code } = req.body;
    if (!identifier || !code) return error(res, 'identifier and code required', 400);

    const result = await verifyOtpCode({ identifier, purpose, code });
    if (!result.ok) return error(res, result.message, 400);

    let user = result.otp.user ? await User.findById(result.otp.user) : null;
    if (!user) {
      const id = String(identifier).trim().toLowerCase();
      user =
        (await User.findOne({ email: id })) ||
        (await User.findOne({ phone: identifier }));
    }
    if (!user) return error(res, 'User not found', 404);
    if (user.isActive === false) {
      return error(res, 'Account is inactive. Contact support.', 403);
    }

    if (result.otp.channel === 'PHONE') user.isPhoneVerified = true;
    if (result.otp.channel === 'EMAIL') user.isEmailVerified = true;
    user.refreshToken = signRefreshToken(user._id);
    await user.save({ validateBeforeSave: false });

    await createNotification({
      userId: user._id,
      title: purpose === 'SIGNUP' ? 'Account verified' : 'Login successful',
      message:
        purpose === 'SIGNUP'
          ? 'Your account is verified. You can now book services.'
          : 'You signed in successfully.',
      type: 'SYSTEM',
    });

    return sendTokens(user, res, purpose === 'SIGNUP' ? 'Account verified' : 'Login successful');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 401);
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user || user.isActive === false) return error(res, 'Invalid refresh token', 401);
    return success(res, { accessToken: signAccessToken(user._id) });
  } catch {
    return error(res, 'Invalid refresh token', 401);
  }
};

export const me = async (req, res) => success(res, req.user);

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return success(res, null, 'If email exists, reset link sent');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - YOURMAHABALESHWAR.COM',
      html: `<p>Reset token: ${resetToken}</p><p>Use POST /api/auth/reset-password with token and new password.</p>`,
    });
    return success(res, null, 'If email exists, reset link sent');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');
    if (!user) return error(res, 'Invalid or expired token', 400);
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return success(res, null, 'Password updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  return success(res, null, 'Logged out');
};
