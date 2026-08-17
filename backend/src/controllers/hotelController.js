import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import { ROLES } from '../constants/roles.js';
import { success, error } from '../utils/apiResponse.js';
import { attachHotelPrices, enrichHotel } from '../utils/listingEnrich.js';
import { mapHotelMine } from '../utils/vendorMineListings.js';
import { denyIfNotOwner, stampOwnerOnCreate, stripOwnerOnUpdate } from '../utils/vendorListingAccess.js';

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
  const slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const payload = stampOwnerOnCreate(req, { ...req.body, slug }, 'vendor');
  const hotel = await Hotel.create(payload);
  return success(res, hotel, 'Hotel created', 201);
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
  Object.assign(hotel, stripOwnerOnUpdate(req, req.body, 'vendor'));
  await hotel.save();
  return success(res, hotel);
};

export const updateResort = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel || hotel.type !== 'RESORT') return error(res, 'Resort not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  Object.assign(hotel, stripOwnerOnUpdate(req, { ...req.body, type: 'RESORT' }, 'vendor'));
  await hotel.save();
  return success(res, hotel);
};

export const deleteHotel = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return error(res, 'Hotel not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  hotel.isActive = false;
  await hotel.save();
  return success(res, null, 'Hotel deactivated');
};

export const deleteResort = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel || hotel.type !== 'RESORT') return error(res, 'Resort not found', 404);
  const denied = denyIfNotOwner(req, hotel, 'vendor');
  if (denied) return error(res, denied.message, denied.status);
  hotel.isActive = false;
  await hotel.save();
  return success(res, null, 'Resort deactivated');
};
