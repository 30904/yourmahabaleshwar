import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import { success, error } from '../utils/apiResponse.js';
import { attachHotelPrices, enrichHotel } from '../utils/listingEnrich.js';

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
  const slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const hotel = await Hotel.create({ ...req.body, slug, vendor: req.user._id });
  return success(res, hotel, 'Hotel created', 201);
};

export const updateHotel = async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!hotel) return error(res, 'Hotel not found', 404);
  return success(res, hotel);
};

export const deleteHotel = async (req, res) => {
  await Hotel.findByIdAndUpdate(req.params.id, { isActive: false });
  return success(res, null, 'Hotel deactivated');
};
