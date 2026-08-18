import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Booking from '../models/Booking.js';
import Enquiry from '../models/Enquiry.js';
import KYC from '../models/KYC.js';
import Payout from '../models/Payout.js';
import Banner from '../models/Banner.js';
import Blog from '../models/Blog.js';
import FAQ from '../models/FAQ.js';
import Coupon from '../models/Coupon.js';
import PlatformSettings from '../models/PlatformSettings.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';
import { success, error } from '../utils/apiResponse.js';
import { attachHotelPrices } from '../utils/listingEnrich.js';
import { normalizePropertyImages } from '../utils/propertyImages.js';

function buildHotelData(body, userId) {
  const slug = body.name
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return {
    name: body.name?.trim(),
    slug,
    type: body.type || 'HOTEL',
    description: body.description,
    shortDescription: body.shortDescription,
    address: body.address,
    location: body.location,
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    rating: Number(body.rating) || 4,
    isActive: body.isActive !== false && body.isActive !== 'false',
    isFeatured: body.isFeatured === true || body.isFeatured === 'true',
    checkInTime: body.checkInTime || '14:00',
    checkOutTime: body.checkOutTime || '11:00',
    policies: body.policies,
    commissionRate: Number(body.commissionRate) || 10,
    vendor: body.vendor || userId,
  };
}

function mapRooms(rooms, hotelId) {
  return (rooms || []).map((r) => ({
    hotel: hotelId,
    name: r.name,
    type: r.type || 'STANDARD',
    description: r.description,
    capacity: Number(r.capacity) || 2,
    basePrice: Number(r.basePrice),
    totalRooms: Number(r.totalRooms) || 5,
    isActive: r.isActive !== false,
  }));
}

export const getEnterpriseDashboard = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const last14Days = new Date(today);
  last14Days.setDate(last14Days.getDate() - 13);

  const [
    users,
    customers,
    vendors,
    hotels,
    resorts,
    tentsCount,
    guides,
    drivers,
    bookings,
    todayBookings,
    monthBookings,
    enquiries,
    pendingKyc,
    revenueAgg,
    monthRevenueAgg,
    monthlyRevenue,
    dailyBookings,
    bookingsByType,
    bookingsByStatus,
    recentBookings,
    recentEnquiries,
    pendingKycList,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    User.countDocuments({ role: { $in: VENDOR_ROLES } }),
    Hotel.countDocuments({ isActive: true, type: 'HOTEL' }),
    Hotel.countDocuments({ isActive: true, type: 'RESORT' }),
    Tent.countDocuments({ isActive: true }),
    Guide.countDocuments({ isActive: true }),
    Driver.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: today } }),
    Booking.countDocuments({ createdAt: { $gte: monthStart } }),
    Enquiry.countDocuments({ status: 'NEW' }),
    KYC.countDocuments({ status: 'PENDING' }),
    Booking.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total' }, commission: { $sum: '$commission' } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: last14Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.find()
      .populate('customer', 'name email')
      .populate('hotel', 'name')
      .populate('tent', 'name')
      .populate('guide', 'name')
      .populate('driver', 'name')
      .sort('-createdAt')
      .limit(10),
    Enquiry.find().sort('-createdAt').limit(6),
    KYC.find({ status: 'PENDING' }).populate('user', 'name email role').limit(6),
  ]);

  const topHotels = await Booking.aggregate([
    { $match: { hotel: { $exists: true } } },
    { $group: { _id: '$hotel', bookings: { $sum: 1 }, revenue: { $sum: '$total' } } },
    { $sort: { bookings: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'hotels', localField: '_id', foreignField: '_id', as: 'hotel' } },
    { $unwind: '$hotel' },
    { $project: { name: '$hotel.name', bookings: 1, revenue: 1 } },
  ]);

  return success(res, {
    kpis: {
      totalRevenue: revenueAgg[0]?.total || 0,
      commission: revenueAgg[0]?.commission || 0,
      monthRevenue: monthRevenueAgg[0]?.total || 0,
      monthBookings: monthRevenueAgg[0]?.count || monthBookings,
      todayBookings,
      activeProperties: hotels + resorts + tentsCount,
      hotels,
      resorts,
      tents: tentsCount,
      pendingKyc,
      activeGuides: guides,
      activeDrivers: drivers,
      totalBookings: bookings,
      newEnquiries: enquiries,
      totalUsers: users,
      customers,
      vendors,
    },
    monthlyRevenue,
    dailyBookings,
    bookingsByType,
    bookingsByStatus,
    topHotels,
    recentBookings,
    recentEnquiries,
    pendingKycList,
  });
};

export const getAdminProperties = async (req, res) => {
  // Admin default: show BOTH active + inactive. Public hotel APIs stay active-only.
  const { type, search, status = 'all', page = 1, limit = 50 } = req.query;
  const filter = {};
  if (type && type !== 'ALL') filter.type = type.toUpperCase();
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (status === 'featured') filter.isFeatured = true;
  else if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;
  // status === 'all' (default): no isActive filter

  const tentFilter = {};
  if (search) tentFilter.name = { $regex: search, $options: 'i' };
  if (status === 'active') tentFilter.isActive = true;
  else if (status === 'inactive') tentFilter.isActive = false;

  const skip = (page - 1) * limit;
  const [raw, total] = await Promise.all([
    Hotel.find(filter).populate('vendor', 'name email').skip(skip).limit(Number(limit)).sort('-createdAt'),
    Hotel.countDocuments(filter),
  ]);
  const items = await attachHotelPrices(raw);
  const tents =
    type === 'TENT' || !type || type === 'ALL'
      ? await Tent.find(tentFilter).populate('operator', 'name email').sort('-createdAt').limit(100)
      : [];

  return success(res, { hotels: items, tents, total, page: Number(page), pages: Math.ceil(total / limit) });
};

export const createAdminProperty = async (req, res) => {
  try {
    if (!req.body.name?.trim()) return error(res, 'Property name is required', 400);

    const images = await normalizePropertyImages(req.body.images || []);
    if (!images.length) return error(res, 'At least one property image is required', 400);

    const hotel = await Hotel.create({
      ...buildHotelData(req.body, req.user._id),
      images,
    });

    const rooms = req.body.rooms || [];
    if (rooms.length) {
      await Room.insertMany(mapRooms(rooms, hotel._id));
    }

    const savedRooms = await Room.find({ hotel: hotel._id });
    return success(res, { hotel, rooms: savedRooms }, 'Property created', 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'A property with this name already exists', 400);
    return error(res, err.message || 'Failed to create property', 500);
  }
};

/** Toggle active flag only — safe for admin list actions (does not wipe other fields). */
export const setAdminPropertyActive = async (req, res) => {
  try {
    const { isActive, listingType, commissionRate } = req.body;
    if (typeof isActive !== 'boolean') return error(res, 'isActive boolean required', 400);

    const isActivating = isActive === true;
    const shouldSetCommission = isActivating && commissionRate != null;
    const parsedCommission = shouldSetCommission ? Number(commissionRate) : null;
    if (isActivating && (parsedCommission == null || !Number.isFinite(parsedCommission))) {
      // We require commission when turning a listing on from pending/inactive.
      return error(res, 'commissionRate number is required when activating', 400);
    }

    const update = { isActive };
    if (isActivating) update.commissionRate = parsedCommission;

    if (listingType === 'TENT') {
      const doc = await Tent.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Tent not found', 404);
      return success(res, doc, isActive ? 'Marked active (commission set)' : 'Marked inactive');
    }

    if (listingType === 'HOMESTAY') {
      const doc = await Homestay.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Homestay not found', 404);
      return success(res, doc, isActive ? 'Marked active (commission set)' : 'Marked inactive');
    }

    if (listingType === 'HORSE') {
      const doc = await Horse.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Horse not found', 404);
      return success(res, doc, isActive ? 'Marked active (commission set)' : 'Marked inactive');
    }

    // HOTEL / RESORT
    const doc = await Hotel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return error(res, 'Property not found', 404);
    return success(res, doc, isActive ? 'Marked active (commission set)' : 'Marked inactive');
  } catch (err) {
    return error(res, err.message || 'Failed to update status', 500);
  }
};

export const updateAdminProperty = async (req, res) => {
  try {
    const existing = await Hotel.findById(req.params.id);
    if (!existing) return error(res, 'Property not found', 404);

    const update = buildHotelData(req.body, req.user._id);

    if (req.body.images?.length) {
      update.images = await normalizePropertyImages(req.body.images);
    }

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

    if (req.body.rooms) {
      await Room.deleteMany({ hotel: hotel._id });
      const rooms = req.body.rooms || [];
      if (rooms.length) await Room.insertMany(mapRooms(rooms, hotel._id));
    }

    const savedRooms = await Room.find({ hotel: hotel._id });
    return success(res, { hotel, rooms: savedRooms });
  } catch (err) {
    return error(res, err.message || 'Failed to update property', 500);
  }
};

export const getAdminProperty = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).populate('vendor', 'name email');
  if (!hotel) return error(res, 'Property not found', 404);
  const rooms = await Room.find({ hotel: hotel._id });
  return success(res, { hotel, rooms });
};

export const getAdminBookings = async (req, res) => {
  const { type, status, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (type) filter.type = type.toUpperCase();
  if (status) filter.status = status.toUpperCase();
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('hotel tent guide driver room')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);
  return success(res, { items, total, page: Number(page), pages: Math.ceil(total / limit) });
};

export const getAdminGuides = async (req, res) => {
  const { search, kycStatus } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  const guides = await Guide.find(filter).populate('user', 'name email phone').sort('-createdAt');
  let kycMap = {};
  if (guides.length) {
    const kycs = await KYC.find({ user: { $in: guides.map((g) => g.user) } });
    kycMap = Object.fromEntries(kycs.map((k) => [k.user.toString(), k]));
  }
  const items = guides.map((g) => ({
    ...g.toObject(),
    kyc: kycMap[g.user?._id?.toString()] || null,
  }));
  const filtered = kycStatus
    ? items.filter((i) => (i.kyc?.status || 'NONE') === kycStatus.toUpperCase())
    : items;
  return success(res, filtered);
};

export const getAdminDrivers = async (req, res) => {
  const filter = {};
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  const drivers = await Driver.find(filter).populate('user', 'name email phone').sort('-createdAt');
  return success(res, drivers);
};

export const getAdminVendors = async (req, res) => {
  const { role } = req.query;
  const filter = {
    role: {
      $in: [
        ROLES.HOTEL_VENDOR,
        ROLES.HOMESTAY_VENDOR,
        ROLES.TENT_OPERATOR,
        ROLES.GUIDE,
        ROLES.DRIVER,
        ROLES.HORSE_OPERATOR,
      ],
    },
  };
  if (role) filter.role = role;
  const vendors = await User.find(filter).select('-password').sort('-createdAt');
  return success(res, vendors);
};

export const getAdminCustomers = async (req, res) => {
  const customers = await User.find({ role: ROLES.CUSTOMER }).select('-password').sort('-createdAt').limit(200);
  return success(res, customers);
};

export const getCoupons = async (req, res) => success(res, await Coupon.find().sort('-createdAt'));
export const createCoupon = async (req, res) => success(res, await Coupon.create(req.body), 'Created', 201);
export const updateCoupon = async (req, res) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return error(res, 'Coupon not found', 404);
  return success(res, c);
};

export const getPlatformSettings = async (req, res) => {
  let settings = await PlatformSettings.findOne({ key: 'default' });
  if (!settings) settings = await PlatformSettings.create({ key: 'default' });
  return success(res, settings);
};

export const updatePlatformSettings = async (req, res) => {
  const settings = await PlatformSettings.findOneAndUpdate({ key: 'default' }, req.body, { new: true, upsert: true });
  return success(res, settings);
};

export const getFinanceSummary = async (req, res) => {
  const [revenue, payouts, transactions] = await Promise.all([
    Booking.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$total' },
          commission: { $sum: '$commission' },
          count: { $sum: 1 },
        },
      },
    ]),
    Payout.find().populate('vendor', 'name email').sort('-createdAt').limit(20),
    Booking.find({ paymentStatus: { $in: ['PAID', 'REFUNDED'] } })
      .populate('customer', 'name')
      .sort('-createdAt')
      .limit(30)
      .select('bookingNumber total paymentStatus type createdAt customer'),
  ]);
  return success(res, { revenueByType: revenue, payouts, transactions });
};
