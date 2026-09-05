import Canvasser from '../models/Canvasser.js';
import { success, error } from '../utils/apiResponse.js';

function pickFields(body) {
  const fields = [
    'fullName',
    'dateOfBirth',
    'mobile',
    'whatsapp',
    'currentAddress',
    'educationalQualification',
    'totalWorkExperience',
    'languagesKnown',
    'ownVehicle',
    'drivingLicense',
    'joiningDate',
    'termsAccepted',
    'declarationAccepted',
    'declarationDate',
    'notes',
    'isActive',
  ];
  const data = {};
  for (const key of fields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

export const listCanvassers = async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search?.trim()) {
    const q = search.trim();
    filter.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { mobile: { $regex: q, $options: 'i' } },
      { whatsapp: { $regex: q, $options: 'i' } },
    ];
  }
  const rows = await Canvasser.find(filter).sort('-createdAt').limit(500);
  return success(res, rows);
};

export const getCanvasser = async (req, res) => {
  const doc = await Canvasser.findById(req.params.id);
  if (!doc) return error(res, 'Canvasser not found', 404);
  return success(res, doc);
};

export const createCanvasser = async (req, res) => {
  try {
    const data = pickFields(req.body);
    if (!data.fullName?.trim()) return error(res, 'Full name is required', 400);
    if (!data.mobile?.trim()) return error(res, 'Mobile / WhatsApp number is required', 400);
    if (!data.termsAccepted || !data.declarationAccepted) {
      return error(res, 'Terms and declaration must be accepted', 400);
    }

    const doc = await Canvasser.create({
      ...data,
      fullName: data.fullName.trim(),
      mobile: data.mobile.trim(),
      declarationDate: data.declarationDate || new Date(),
      isActive: data.isActive !== false,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return success(res, doc, 'Canvasser created', 201);
  } catch (err) {
    return error(res, err.message || 'Failed to create canvasser', 400);
  }
};

export const updateCanvasser = async (req, res) => {
  try {
    const existing = await Canvasser.findById(req.params.id);
    if (!existing) return error(res, 'Canvasser not found', 404);

    const data = pickFields(req.body);
    Object.assign(existing, data);
    if (data.fullName) existing.fullName = data.fullName.trim();
    if (data.mobile) existing.mobile = data.mobile.trim();
    existing.updatedBy = req.user._id;
    await existing.save();

    return success(res, existing, 'Canvasser updated');
  } catch (err) {
    return error(res, err.message || 'Failed to update canvasser', 400);
  }
};
