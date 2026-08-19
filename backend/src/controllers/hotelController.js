import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import { ROLES } from '../constants/roles.js';
import { success, error } from '../utils/apiResponse.js';
import { attachHotelPrices, enrichHotel } from '../utils/listingEnrich.js';
import { mapHotelMine } from '../utils/vendorMineListings.js';
import { denyIfNotOwner, stampOwnerOnCreate, stripOwnerOnUpdate } from '../utils/vendorListingAccess.js';
import { APPROVAL_STATUS, denyIfVendorCannotEdit, stampPendingIfVendor } from '../utils/listingApproval.js';

const listMyStayProperties = (forcedType) => async (req, res) => {
  const requested = String(forcedType || req.query.type || '').toUpperCase();
  const filter = req.user.role === ROLES.SUPER_ADMIN ? {} : { vendor: req.user._id };
  if (requested === 'HOTEL' || requested === 'RESORT') filter.type = requested;
  const hotels = await Hotel.find(filter).sort('-createdAt').limit(200);
  const rooms = await Room.find({ hotel: { $in: hotels.map((h) => h._id) } }).select('hotel basePrice');
  const minByHotel = {};
  rooms.forEach((room) => {
    const key = String(room.hotel);
    if (minByHotel[key] == null || room.basePrice < minByHotel[key]) minByHotel[key] = room.basePrice;
  });
  return success(
    res,
    hotels.map((hotel) => mapHotelMine(hotel, minByHotel[String(hotel._id)]))
  );
};

export const listMyHotels = listMyStayProperties('HOTEL');
export const listMyResorts = listMyStayProperties('RESORT');

const mapVendorRooms = (rooms, hotelId) =>
  (rooms || [])
    .filter((room) => room?.name && Number(room.basePrice) > 0)
    .map((room) => ({
      hotel: hotelId,
      name: String(room.name).trim(),
      type: room.type || 'STANDARD',
      description: room.description || '',
      capacity: Number(room.capacity) || 2,
      basePrice: Number(room.basePrice),
      totalRooms: Number(room.totalRooms) || 5,
      isActive: room.isActive !== false,
    }));

const syncHotelRooms = async (hotelId, rooms) => {
  if (!Array.isArray(rooms)) return;
  await Room.deleteMany({ hotel: hotelId });
  const mapped = mapVendorRooms(rooms, hotelId);
  if (mapped.length) await Room.insertMany(mapped);
};

const splitStayBody = (body = {}) => {
  const { rooms, ...rest } = body;
  delete rest.slug;
  return { rooms, rest };
};

const getMyStayProperty = (forcedType) => async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return error(res, 'Hotel not found', 404);
  if (forcedType && hotel.type !== forcedType) return error(res, 'Not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  const rooms = await Room.find({ hotel: hotel._id });
  return success(res, { ...hotel.toObject(), rooms });
};

export const getMyHotel = getMyStayProperty('HOTEL');
export const getMyResort = getMyStayProperty('RESORT');

export const getHotels = async (req, res) => {
  const { type, featured, search, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type.toUpperCase();
  if (featured === 'true') filter.isFeatured = true;
  if (search) filter.name = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [raw, total] = await Promise.all([
    Hotel.find(filter).populate('vendor', 'name email phone').skip(skip).limit(Number(limit)).sort('-createdAt'),
    Hotel.countDocuments(filter),
  ]);
  const items = await attachHotelPrices(raw);
  return success(res, { items, total, page: Number(page), pages: Math.ceil(total / limit) });
};

export const getHotelBySlug = async (req, res) => {
  const hotel = await Hotel.findOne({ slug: req.params.slug, isActive: true });
  if (!hotel) return error(res, 'Hotel not found', 404);
  const rooms = await Room.find({ hotel: hotel._id, isActive: { $ne: false } });
  const minPrice = rooms.length ? Math.min(...rooms.map((r) => r.basePrice)) : null;
  return success(res, { hotel: enrichHotel(hotel, minPrice), rooms });
};

export const createHotel = async (req, res) => {
  if (!req.body?.name) return error(res, 'Name is required', 400);
  const { rooms, rest } = splitStayBody(req.body);
  const slug = `${String(rest.name).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString(36)}`;
  try {
    const payload = stampPendingIfVendor(req, stampOwnerOnCreate(req, { ...rest, slug }, 'vendor'));
    const hotel = await Hotel.create(payload);
    await syncHotelRooms(hotel._id, rooms);
    const savedRooms = await Room.find({ hotel: hotel._id });
    return success(res, { ...hotel.toObject(), rooms: savedRooms }, 'Hotel created', 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'A listing with this name already exists', 400);
    return error(res, err.message || 'Failed to create hotel', 400);
  }
};

export const createResort = async (req, res) => {
  req.body = { ...req.body, type: 'RESORT' };
  return createHotel(req, res);
};

export const updateHotel = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return error(res, 'Hotel not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  const blocked = denyIfVendorCannotEdit(req, hotel);
  if (blocked) return error(res, blocked.message, blocked.status);
  const { rooms, rest } = splitStayBody(req.body);
  Object.assign(hotel, stripOwnerOnUpdate(req, rest, 'vendor'));
  await hotel.save();
  await syncHotelRooms(hotel._id, rooms);
  const savedRooms = await Room.find({ hotel: hotel._id });
  return success(res, { ...hotel.toObject(), rooms: savedRooms });
};

export const updateResort = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel || hotel.type !== 'RESORT') return error(res, 'Resort not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  const blocked = denyIfVendorCannotEdit(req, hotel);
  if (blocked) return error(res, blocked.message, blocked.status);
  const { rooms, rest } = splitStayBody(req.body);
  Object.assign(hotel, stripOwnerOnUpdate(req, { ...rest, type: 'RESORT' }, 'vendor'));
  await hotel.save();
  await syncHotelRooms(hotel._id, rooms);
  const savedRooms = await Room.find({ hotel: hotel._id });
  return success(res, { ...hotel.toObject(), rooms: savedRooms });
};

export const deleteHotel = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return error(res, 'Hotel not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  hotel.isActive = false;
  if (hotel.approvalStatus === APPROVAL_STATUS.APPROVED) hotel.approvalStatus = APPROVAL_STATUS.REJECTED;
  await hotel.save();
  return success(res, null, 'Hotel deactivated');
};

export const deleteResort = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel || hotel.type !== 'RESORT') return error(res, 'Resort not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  hotel.isActive = false;
  if (hotel.approvalStatus === APPROVAL_STATUS.APPROVED) hotel.approvalStatus = APPROVAL_STATUS.REJECTED;
  await hotel.save();
  return success(res, null, 'Resort deactivated');
};
