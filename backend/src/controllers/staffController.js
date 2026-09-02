import User from '../models/User.js';
import StaffProfile from '../models/StaffProfile.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import { success, error } from '../utils/apiResponse.js';

const STAFF_CREATE_ROLES = STAFF_ROLES.filter((r) => r !== ROLES.SUPER_ADMIN);

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

function pickProfileFields(body) {
  const fields = [
    'employeeId',
    'designation',
    'department',
    'dateOfBirth',
    'dateOfJoining',
    'gender',
    'address',
    'aadhaarNumber',
    'panNumber',
    'documents',
    'emergencyContact',
    'notes',
  ];
  const profile = {};
  for (const key of fields) {
    if (body[key] !== undefined) profile[key] = body[key];
  }
  return profile;
}

export const listStaff = async (req, res) => {
  const users = await User.find({ role: { $in: STAFF_ROLES } })
    .select('-password')
    .sort('-createdAt');
  const profiles = await StaffProfile.find({ user: { $in: users.map((u) => u._id) } });
  const profileByUser = Object.fromEntries(profiles.map((p) => [String(p.user), p]));

  const rows = users.map((user) => ({
    ...sanitizeUser(user),
    profile: profileByUser[String(user._id)] || null,
  }));

  return success(res, rows);
};

export const getStaff = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user || !STAFF_ROLES.includes(user.role)) return error(res, 'Staff member not found', 404);
  const profile = await StaffProfile.findOne({ user: user._id });
  return success(res, { ...sanitizeUser(user), profile });
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role, isActive } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return error(res, 'name, email and password are required', 400);
    }
    if (password.length < 6) return error(res, 'password must be at least 6 characters', 400);

    const staffRole = role && STAFF_CREATE_ROLES.includes(role) ? role : ROLES.OFFICE_STAFF_HOTEL;
    if (await User.findOne({ email: email.toLowerCase().trim() })) {
      return error(res, 'Email already exists', 400);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      role: staffRole,
      isActive: isActive !== false,
    });

    const profile = await StaffProfile.create({
      user: user._id,
      ...pickProfileFields(req.body),
      createdBy: req.user._id,
    });

    return success(res, { ...sanitizeUser(user), profile }, 'Staff created', 201);
  } catch (err) {
    return error(res, err.message || 'Failed to create staff', 400);
  }
};

export const updateStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !STAFF_ROLES.includes(user.role)) return error(res, 'Staff member not found', 404);

    const userUpdates = {};
    if (req.body.name !== undefined) userUpdates.name = req.body.name;
    if (req.body.phone !== undefined) userUpdates.phone = req.body.phone;
    if (req.body.isActive !== undefined) userUpdates.isActive = req.body.isActive;
    if (req.body.role !== undefined && STAFF_CREATE_ROLES.includes(req.body.role)) {
      userUpdates.role = req.body.role;
    }

    if (Object.keys(userUpdates).length) {
      Object.assign(user, userUpdates);
      await user.save();
    }

    const profileFields = pickProfileFields(req.body);
    let profile = await StaffProfile.findOne({ user: user._id });
    if (profile) {
      Object.assign(profile, profileFields);
      await profile.save();
    } else if (Object.keys(profileFields).length) {
      profile = await StaffProfile.create({
        user: user._id,
        ...profileFields,
        createdBy: req.user._id,
      });
    }

    const fresh = await User.findById(user._id).select('-password');
    return success(res, { ...sanitizeUser(fresh), profile });
  } catch (err) {
    return error(res, err.message || 'Failed to update staff', 400);
  }
};

export const resetStaffPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return error(res, 'password must be at least 6 characters', 400);

  const user = await User.findById(req.params.id).select('+password');
  if (!user || !STAFF_ROLES.includes(user.role)) return error(res, 'Staff member not found', 404);

  user.password = password;
  await user.save();
  return success(res, null, 'Password updated');
};
