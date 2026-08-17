import Amenity from '../models/Amenity.js';
import RoomType from '../models/RoomType.js';
import { success, error } from '../utils/apiResponse.js';

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export const listAmenities = async (req, res) => {
  const activeOnly = req.query.active === 'true';
  const filter = activeOnly ? { isActive: true } : {};
  const data = await Amenity.find(filter).sort({ sortOrder: 1, name: 1 });
  return success(res, data);
};

export const createAmenity = async (req, res) => {
  try {
    const { name, icon, category, sortOrder, isActive } = req.body;
    if (!name?.trim()) return error(res, 'Name is required', 400);
    const slug = slugify(name);
    const existing = await Amenity.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) return error(res, 'Amenity already exists', 409);
    const doc = await Amenity.create({
      name: name.trim(),
      slug,
      icon: icon || 'Sparkles',
      category: category || 'GENERAL',
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
    });
    return success(res, doc, 'Amenity created', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const updateAmenity = async (req, res) => {
  try {
    const doc = await Amenity.findById(req.params.id);
    if (!doc) return error(res, 'Amenity not found', 404);
    const { name, icon, category, sortOrder, isActive } = req.body;
    if (name?.trim()) {
      doc.name = name.trim();
      doc.slug = slugify(name);
    }
    if (icon) doc.icon = icon;
    if (category) doc.category = category;
    if (sortOrder !== undefined) doc.sortOrder = Number(sortOrder);
    if (isActive !== undefined) doc.isActive = Boolean(isActive);
    await doc.save();
    return success(res, doc, 'Amenity updated');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const deleteAmenity = async (req, res) => {
  const doc = await Amenity.findByIdAndDelete(req.params.id);
  if (!doc) return error(res, 'Amenity not found', 404);
  return success(res, null, 'Amenity deleted');
};

export const listRoomTypes = async (req, res) => {
  const activeOnly = req.query.active === 'true';
  const filter = activeOnly ? { isActive: true } : {};
  const data = await RoomType.find(filter).sort({ sortOrder: 1, name: 1 });
  return success(res, data);
};

export const createRoomType = async (req, res) => {
  try {
    const { code, name, description, defaultCapacity, sortOrder, isActive } = req.body;
    const normalizedCode = String(code || name || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    if (!normalizedCode || !name?.trim()) return error(res, 'Code and name are required', 400);
    if (await RoomType.findOne({ code: normalizedCode })) {
      return error(res, 'Room type code already exists', 409);
    }
    const doc = await RoomType.create({
      code: normalizedCode,
      name: name.trim(),
      description: description || '',
      defaultCapacity: Number(defaultCapacity) || 2,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive !== false,
    });
    return success(res, doc, 'Room type created', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const updateRoomType = async (req, res) => {
  try {
    const doc = await RoomType.findById(req.params.id);
    if (!doc) return error(res, 'Room type not found', 404);
    const { name, description, defaultCapacity, sortOrder, isActive } = req.body;
    if (name?.trim()) doc.name = name.trim();
    if (description !== undefined) doc.description = description;
    if (defaultCapacity !== undefined) doc.defaultCapacity = Number(defaultCapacity) || 2;
    if (sortOrder !== undefined) doc.sortOrder = Number(sortOrder);
    if (isActive !== undefined) doc.isActive = Boolean(isActive);
    await doc.save();
    return success(res, doc, 'Room type updated');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const deleteRoomType = async (req, res) => {
  const doc = await RoomType.findByIdAndDelete(req.params.id);
  if (!doc) return error(res, 'Room type not found', 404);
  return success(res, null, 'Room type deleted');
};
