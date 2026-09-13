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
import Review from '../models/Review.js';
import { ROLES, VENDOR_ROLES, STAFF_ROLES } from '../constants/roles.js';
import { BOOKING_STATUS, BOOKING_TYPES, BOOKING_SOURCE } from '../constants/booking.js';
import { calculateTotalAsync, getNights } from '../utils/pricing.js';
import { generateInvoicePdf } from '../services/invoiceService.js';
import { createNotification } from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';
import { guideOpenPrice, normalizeGuidePackageId } from '../constants/guideClientRateChart.js';
import { taxiRoutePrice } from '../constants/taxiClientRateChart.js';
import { driverPackagePrice } from '../constants/driverClientRateChart.js';
import { horsePackagePrice } from '../constants/horseClientRateChart.js';
import {
  SERVICE_OVERTIME_PER_HOUR,
  isTripServiceBooking,
  isArrivalConfirmed,
  isServiceEnded,
  serviceTripLabel,
} from '../constants/serviceTrip.js';
import crypto from 'crypto';
import { canApprove, canSeeFinance } from '../utils/roleAccess.js';
import { success, error } from '../utils/apiResponse.js';
import { attachHotelPrices } from '../utils/listingEnrich.js';
import { normalizePropertyImages } from '../utils/propertyImages.js';
import { APPROVAL_STATUS, approvalFilter } from '../utils/listingApproval.js';
import {
  isStayListingType,
  startSubscriptionOnApproval,
} from '../services/stayListingSubscriptionService.js';

function buildHotelData(body, userId, options = {}) {
  const slug = body.name
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const staffCreated = options.staffCreated === true;
  const autoApprove = !staffCreated && body.isActive !== false && body.isActive !== 'false';

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
    isActive: autoApprove,
    approvalStatus: autoApprove ? APPROVAL_STATUS.APPROVED : APPROVAL_STATUS.PENDING,
    isFeatured: body.isFeatured === true || body.isFeatured === 'true',
    checkInTime: body.checkInTime || '14:00',
    checkOutTime: body.checkOutTime || '11:00',
    policies: body.policies,
    gstNumber: body.gstNumber,
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

  const payload = {
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
  };

  if (!canSeeFinance(req.user?.role)) {
    delete payload.kpis.totalRevenue;
    delete payload.kpis.commission;
    delete payload.kpis.monthRevenue;
    delete payload.monthlyRevenue;
    payload.dailyBookings = (payload.dailyBookings || []).map(({ _id, bookings: count }) => ({
      _id,
      bookings: count,
    }));
    payload.topHotels = (payload.topHotels || []).map(({ name, bookings: count }) => ({
      name,
      bookings: count,
    }));
    payload.recentBookings = (payload.recentBookings || []).map((b) => {
      const row = b.toObject ? b.toObject() : { ...b };
      delete row.total;
      delete row.commission;
      return row;
    });
  }

  return success(res, payload);
};

export const getAdminProperties = async (req, res) => {
  // Admin default: show BOTH active + inactive. Public hotel APIs stay active-only.
  const { type, search, status = 'all', page = 1, limit = 50 } = req.query;
  const filter = { ...approvalFilter(status) };
  if (type && type !== 'ALL') filter.type = type.toUpperCase();
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (status === 'featured') filter.isFeatured = true;

  const tentFilter = { ...approvalFilter(status) };
  if (search) tentFilter.name = { $regex: search, $options: 'i' };

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

    const images = await normalizePropertyImages(req.body.images || [], {
      propertyId: req.body.propertyId || 'draft',
    });
    if (!images.length) return error(res, 'At least one property image is required', 400);

    const staffCreated = STAFF_ROLES.includes(req.user?.role);
    const hotel = await Hotel.create({
      ...buildHotelData(req.body, req.user._id, { staffCreated }),
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
    if (!canApprove(req.user?.role)) {
      return error(res, 'Only super admin can approve or reject listings', 403);
    }
    const { isActive, listingType, commissionRate, renewalPrice } = req.body;
    if (typeof isActive !== 'boolean') return error(res, 'isActive boolean required', 400);

    const isActivating = isActive === true;
    const shouldSetCommission = isActivating && commissionRate != null;
    const parsedCommission = shouldSetCommission ? Number(commissionRate) : null;
    if (isActivating && (parsedCommission == null || !Number.isFinite(parsedCommission))) {
      // We require commission when turning a listing on from pending/inactive.
      return error(res, 'commissionRate number is required when activating', 400);
    }

    const update = { isActive };
    if (isActivating) {
      update.commissionRate = parsedCommission;
      update.approvalStatus = APPROVAL_STATUS.APPROVED;
      if (renewalPrice != null && Number.isFinite(Number(renewalPrice)) && isStayListingType(listingType)) {
        update.renewalPrice = Number(renewalPrice);
      }
    } else {
      update.approvalStatus = APPROVAL_STATUS.REJECTED;
    }

    if (listingType === 'TENT') {
      const doc = await Tent.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Tent not found', 404);
      return success(res, doc, isActive ? 'Listing approved' : 'Listing rejected');
    }

    if (listingType === 'HOMESTAY') {
      const doc = await Homestay.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Homestay/Villa not found', 404);
      if (isActivating) {
        await startSubscriptionOnApproval('HOMESTAY', doc._id, { renewalPrice });
      }
      return success(res, doc, isActive ? 'Listing approved' : 'Listing rejected');
    }

    if (listingType === 'HORSE') {
      const doc = await Horse.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Horse not found', 404);
      return success(res, doc, isActive ? 'Listing approved' : 'Listing rejected');
    }

    if (listingType === 'GUIDE') {
      const doc = await Guide.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Guide not found', 404);
      return success(res, doc, isActive ? 'Listing approved' : 'Listing rejected');
    }

    if (listingType === 'DRIVER' || listingType === 'TAXI') {
      const doc = await Driver.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!doc) return error(res, 'Driver not found', 404);
      return success(res, doc, isActive ? 'Listing approved' : 'Listing rejected');
    }

    // HOTEL / RESORT
    const doc = await Hotel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return error(res, 'Property not found', 404);
    if (isActivating && isStayListingType(listingType || doc.type)) {
      await startSubscriptionOnApproval(listingType || doc.type, doc._id, { renewalPrice });
    }
    return success(res, doc, isActive ? 'Listing approved' : 'Listing rejected');
  } catch (err) {
    return error(res, err.message || 'Failed to update status', 500);
  }
};

export const getAdminListingReview = async (req, res) => {
  try {
    const type = String(req.query.type || 'HOTEL').toUpperCase();
    const { id } = req.params;
    let listing = null;
    let rooms = [];

    if (type === 'TENT') {
      listing = await Tent.findById(id).populate('operator', 'name email phone');
    } else if (type === 'HOMESTAY') {
      listing = await Homestay.findById(id).populate('vendor', 'name email phone');
    } else if (type === 'HORSE') {
      listing = await Horse.findById(id).populate('operator', 'name email phone');
    } else if (type === 'GUIDE') {
      listing = await Guide.findById(id).populate('user', 'name email phone');
    } else if (type === 'DRIVER' || type === 'TAXI') {
      listing = await Driver.findById(id).populate('user', 'name email phone');
    } else {
      listing = await Hotel.findById(id).populate('vendor', 'name email phone');
      if (listing) rooms = await Room.find({ hotel: listing._id });
    }

    if (!listing) return error(res, 'Listing not found', 404);

    const vendorUser = listing.vendor || listing.operator || listing.user || null;
    const vendorId = vendorUser?._id || vendorUser;
    const kyc = vendorId ? await KYC.findOne({ user: vendorId }) : null;

    return success(res, {
      listing,
      rooms: type === 'HOMESTAY' ? listing.rooms || [] : rooms,
      kyc,
      vendor: vendorUser,
    });
  } catch (err) {
    return error(res, err.message || 'Failed to load listing review', 500);
  }
};

export const updateAdminProperty = async (req, res) => {
  try {
    const existing = await Hotel.findById(req.params.id);
    if (!existing) return error(res, 'Property not found', 404);

    const update = buildHotelData(req.body, req.user._id);
    delete update.isActive;
    delete update.approvalStatus;
    delete update.commissionRate;
    delete update.slug;

    if (req.body.images?.length) {
      update.images = await normalizePropertyImages(req.body.images, {
        propertyId: req.params.id,
      });
    }

    if (req.body.renewalPrice != null && Number.isFinite(Number(req.body.renewalPrice))) {
      update.renewalPrice = Number(req.body.renewalPrice);
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
  const { type, status, serviceTenant, assignmentStatus, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (type) filter.type = type.toUpperCase();
  if (status) filter.status = status.toUpperCase();
  if (serviceTenant) filter.serviceTenant = String(serviceTenant).toUpperCase();
  if (assignmentStatus) filter.assignmentStatus = String(assignmentStatus).toUpperCase();
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('vendor', 'name email role')
      .populate('hotel tent guide driver horse room homestay')
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
  const { search, kycStatus, vendorType } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  const vt = String(vendorType || '').toUpperCase();
  if (vt === 'TAXI' || vt === 'DRIVER') {
    const role = vt === 'TAXI' ? ROLES.TAXI_OPERATOR : ROLES.DRIVER;
    const ownerIds = await User.find({ role }).distinct('_id');
    filter.user = { $in: ownerIds };
  }
  const drivers = await Driver.find(filter).populate('user', 'name email phone role').sort('-createdAt');
  let kycMap = {};
  if (drivers.length) {
    const kycs = await KYC.find({ user: { $in: drivers.map((d) => d.user) } });
    kycMap = Object.fromEntries(kycs.map((k) => [k.user.toString(), k]));
  }
  const items = drivers.map((d) => ({
    ...d.toObject(),
    kyc: kycMap[d.user?._id?.toString()] || null,
  }));
  const filtered = kycStatus
    ? items.filter((i) => (i.kyc?.status || 'NONE') === kycStatus.toUpperCase())
    : items;
  return success(res, filtered);
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
        ROLES.TAXI_OPERATOR,
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

function bookingListingName(booking) {
  return (
    booking.hotel?.name ||
    booking.tent?.name ||
    booking.homestay?.name ||
    booking.guide?.name ||
    booking.driver?.name ||
    booking.horse?.name ||
    '—'
  );
}

export const getAdminCustomerDetail = async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: ROLES.CUSTOMER }).select(
    '-password -refreshToken -resetPasswordToken -resetPasswordExpire'
  );
  if (!customer) return error(res, 'Customer not found', 404);

  const [bookings, enquiries, reviewsCount, paidAgg, totalBookings] = await Promise.all([
    Booking.find({ customer: customer._id })
      .populate('hotel tent guide driver horse homestay room')
      .sort('-createdAt')
      .limit(50),
    Enquiry.find({
      $or: [
        { customer: customer._id },
        ...(customer.email ? [{ email: customer.email }] : []),
        ...(customer.phone ? [{ phone: customer.phone }] : []),
      ],
    })
      .sort('-createdAt')
      .limit(20),
    Review.countDocuments({ user: customer._id }),
    Booking.aggregate([
      { $match: { customer: customer._id, paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Booking.countDocuments({ customer: customer._id }),
  ]);

  const documents = [];
  if (customer.avatar) {
    documents.push({
      id: 'avatar',
      label: 'Profile photo',
      url: customer.avatar,
      uploadedAt: customer.updatedAt,
    });
  }

  for (const booking of bookings) {
    const idProof = booking.guestRegistration?.idProof;
    if (!idProof?.documentUrl) continue;
    documents.push({
      id: `${booking._id}-id-proof`,
      label: `ID proof — ${booking.bookingNumber || 'Booking'}`,
      url: idProof.documentUrl,
      documentName: idProof.documentName,
      idType: idProof.type,
      idNumber: idProof.number,
      nationality: idProof.nationality,
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      bookingType: booking.type,
      uploadedAt: booking.createdAt,
    });
  }

  return success(res, {
    customer,
    stats: {
      bookingsCount: totalBookings,
      reviewsCount,
      totalSpent: paidAgg[0]?.total || 0,
      paidBookingsCount: paidAgg[0]?.count || 0,
    },
    bookings: bookings.map((b) => ({
      _id: b._id,
      bookingNumber: b.bookingNumber,
      type: b.type,
      status: b.status,
      paymentStatus: b.paymentStatus,
      total: b.total,
      createdAt: b.createdAt,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests: b.guests,
      guestRegistration: b.guestRegistration,
      listingName: bookingListingName(b),
    })),
    documents,
    enquiries,
  });
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

async function resolveOrCreateCustomer({ customerId, name, phone, email }) {
  if (customerId) {
    const existing = await User.findById(customerId);
    if (!existing) throw Object.assign(new Error('Customer not found'), { status: 404 });
    return existing;
  }
  const mobile = String(phone || '').trim();
  const fullName = String(name || '').trim();
  if (!fullName) throw Object.assign(new Error('Customer name is required'), { status: 400 });
  if (!mobile) throw Object.assign(new Error('Customer mobile is required'), { status: 400 });

  let user = await User.findOne({ phone: mobile, role: ROLES.CUSTOMER });
  if (!user && email) {
    user = await User.findOne({ email: String(email).toLowerCase().trim() });
  }
  if (user) {
    if (!user.phone) user.phone = mobile;
    if (fullName && user.name !== fullName) user.name = fullName;
    await user.save();
    return user;
  }

  const safeEmail =
    String(email || '').trim().toLowerCase() ||
    `callguest_${mobile.replace(/\D/g, '') || Date.now()}@yourmahabaleshwar.local`;

  return User.create({
    name: fullName,
    phone: mobile,
    email: safeEmail,
    password: crypto.randomBytes(16).toString('hex'),
    role: ROLES.CUSTOMER,
    isActive: true,
  });
}

/** Admin creates a booking (call / walk-in). */
export const createAdminBooking = async (req, res) => {
  try {
    const body = req.body || {};
    const source = String(body.bookingSource || '').toUpperCase();
    if (![BOOKING_SOURCE.CALL, BOOKING_SOURCE.WALK_IN].includes(source)) {
      return error(res, 'Select Call booking or Walk in', 400);
    }

    const kind = String(body.bookingKind || body.type || '').toUpperCase();
    const allowed = ['GUIDE', 'TAXI', 'DRIVER', 'HORSE', 'TENT', 'HOTEL', 'RESORT', 'HOMESTAY'];
    if (!allowed.includes(kind)) return error(res, 'Unsupported booking type', 400);

    const customer = await resolveOrCreateCustomer({
      customerId: body.customerId,
      name: body.customerName,
      phone: body.customerPhone,
      email: body.customerEmail,
    });

    if (!body.checkIn) return error(res, 'Date is required', 400);

    const leadGuest = {
      fullName: customer.name,
      mobile: customer.phone || String(body.customerPhone || '').trim(),
      email: customer.email || '',
      address: String(body.address || '').trim(),
      cityState: String(body.cityState || 'Mahabaleshwar, Maharashtra').trim(),
      pincode: String(body.pincode || '').trim(),
      purpose: 'TOURISM',
    };

    let bookingType = kind;
    let serviceTenant;
    let vendor = null;
    let assignmentStatus = 'ASSIGNED';
    let listingFields = {};
    let subtotal = Number(body.subtotal) || 0;
    let extra = {};

    if (kind === 'GUIDE') {
      bookingType = BOOKING_TYPES.GUIDE;
      serviceTenant = 'GUIDE';
      const packageType = normalizeGuidePackageId(body.guidePackage || '6HR');
      const useBike = body.bikeAddon === true || body.bikeAddon === 'true';
      if (subtotal <= 0) subtotal = guideOpenPrice(packageType === '4HR' ? '4HR' : packageType === '8HR' ? '8HR' : '4HR', useBike);
      // Map 6HR/12HR listing packages to open chart if needed
      if (subtotal <= 0) subtotal = useBike ? 1100 : 900;
      extra.guidePackage = body.guidePackage || packageType;
      extra.bikeAddon = useBike;
      if (body.listingId) {
        const guide = await Guide.findById(body.listingId);
        if (!guide) return error(res, 'Guide listing not found', 404);
        listingFields.guide = guide._id;
        vendor = guide.user;
        if (subtotal <= 0) {
          subtotal =
            (extra.guidePackage === '12HR' || extra.guidePackage === '8HR'
              ? guide.package12hr
              : guide.package6hr) || 900;
          if (useBike) subtotal += guide.bikeAddonPrice || 200;
        }
      } else {
        assignmentStatus = 'UNASSIGNED';
      }
      listingFields.guestRegistration = {
        leadGuest,
        acceptedTermsAt: new Date(),
        tourDetails: {
          packageType: extra.guidePackage,
          bikeAddon: useBike,
          startTime: body.startTime || '09:00',
          specialRequests: body.notes || '',
          packagePrice: subtotal,
        },
      };
    } else if (kind === 'TAXI' || kind === 'DRIVER') {
      bookingType = BOOKING_TYPES.TAXI;
      serviceTenant = kind;
      const routeOrPkg = body.routeId || body.packageId || '';
      if (subtotal <= 0) {
        subtotal = kind === 'DRIVER' ? driverPackagePrice(routeOrPkg) : taxiRoutePrice(routeOrPkg);
      }
      // Booking.taxiType enum is only PER_TRIP | HOURLY (driver packages still use PER_TRIP)
      extra.taxiType = String(body.taxiType || '').toUpperCase() === 'HOURLY' ? 'HOURLY' : 'PER_TRIP';
      if (body.listingId) {
        const driver = await Driver.findById(body.listingId);
        if (!driver) return error(res, 'Driver/taxi listing not found', 404);
        listingFields.driver = driver._id;
        vendor = driver.user;
        if (subtotal <= 0) subtotal = driver.perTripPrice || driver.hourlyRate || 1000;
      } else {
        assignmentStatus = 'UNASSIGNED';
      }
      listingFields.guestRegistration = {
        leadGuest,
        acceptedTermsAt: new Date(),
        taxiDetails: {
          tripType: extra.taxiType,
          routeId: body.routeId || '',
          packageId: body.packageId || '',
          startTime: body.startTime || '09:00',
          tripPrice: subtotal,
          specialRequests: body.notes || '',
          serviceTenant: kind,
        },
      };
    } else if (kind === 'HORSE') {
      bookingType = BOOKING_TYPES.HORSE;
      serviceTenant = 'HORSE';
      const routeId = body.routeId || 'sightseeing';
      if (subtotal <= 0) subtotal = horsePackagePrice(routeId);
      extra.horseRouteId = routeId;
      if (body.listingId) {
        const horse = await Horse.findById(body.listingId);
        if (!horse) return error(res, 'Horse listing not found', 404);
        listingFields.horse = horse._id;
        vendor = horse.operator;
        if (subtotal <= 0) subtotal = horse.priceFrom || 800;
      } else {
        assignmentStatus = 'UNASSIGNED';
      }
      listingFields.guestRegistration = {
        leadGuest,
        acceptedTermsAt: new Date(),
        horseDetails: {
          routeId,
          startTime: body.startTime || '09:00',
          routePrice: subtotal,
          specialRequests: body.notes || '',
          safetyAcknowledged: true,
        },
      };
    } else if (kind === 'TENT') {
      bookingType = BOOKING_TYPES.TENT;
      serviceTenant = 'TENT';
      const qty = Number(body.tentQuantity) || 1;
      const nights = getNights(body.checkIn, body.checkOut || body.checkIn);
      extra.tentQuantity = qty;
      extra.checkOut = body.checkOut || body.checkIn;
      if (body.listingId) {
        const tent = await Tent.findById(body.listingId);
        if (!tent) return error(res, 'Tent listing not found', 404);
        listingFields.tent = tent._id;
        vendor = tent.operator;
        if (subtotal <= 0) subtotal = (tent.pricePerNight || 2000) * qty * nights;
      } else {
        assignmentStatus = 'UNASSIGNED';
        if (subtotal <= 0) subtotal = 2000 * qty * nights;
      }
      listingFields.guestRegistration = { leadGuest, acceptedTermsAt: new Date() };
    } else if (kind === 'HOTEL' || kind === 'RESORT') {
      if (!body.listingId || !body.roomId) return error(res, 'Hotel and room are required', 400);
      const hotel = await Hotel.findById(body.listingId);
      if (!hotel) return error(res, 'Hotel not found', 404);
      const room = await Room.findById(body.roomId);
      if (!room) return error(res, 'Room not found', 404);
      bookingType = hotel.type === 'RESORT' ? BOOKING_TYPES.RESORT : BOOKING_TYPES.HOTEL;
      vendor = hotel.vendor;
      assignmentStatus = 'ASSIGNED';
      listingFields.hotel = hotel._id;
      listingFields.room = room._id;
      const nights = getNights(body.checkIn, body.checkOut || body.checkIn);
      extra.checkOut = body.checkOut || body.checkIn;
      if (subtotal <= 0) subtotal = (room.basePrice || hotel.priceFrom || 0) * nights;
      listingFields.guestRegistration = { leadGuest, acceptedTermsAt: new Date() };
      listingFields.guests = {
        adults: Number(body.adults) || 2,
        children: Number(body.children) || 0,
      };
    } else if (kind === 'HOMESTAY') {
      if (!body.listingId || !body.roomId) return error(res, 'Homestay and room are required', 400);
      const homestay = await Homestay.findById(body.listingId);
      if (!homestay) return error(res, 'Homestay not found', 404);
      bookingType = BOOKING_TYPES.HOMESTAY;
      vendor = homestay.vendor || homestay.operator;
      assignmentStatus = 'ASSIGNED';
      listingFields.homestay = homestay._id;
      listingFields.homestayRoomId = String(body.roomId);
      const nights = getNights(body.checkIn, body.checkOut || body.checkIn);
      extra.checkOut = body.checkOut || body.checkIn;
      const room = (homestay.rooms || []).find((r) => String(r._id) === String(body.roomId));
      if (subtotal <= 0) subtotal = (room?.basePrice || homestay.priceFrom || 0) * nights;
      listingFields.guestRegistration = { leadGuest, acceptedTermsAt: new Date() };
      listingFields.guests = {
        adults: Number(body.adults) || 2,
        children: Number(body.children) || 0,
      };
    }

    if (subtotal <= 0) return error(res, 'Enter a valid amount (subtotal)', 400);

    const pricing = await calculateTotalAsync(subtotal);
    const status = body.status === 'CONFIRMED' ? BOOKING_STATUS.CONFIRMED : BOOKING_STATUS.PENDING;
    if (status === BOOKING_STATUS.CONFIRMED && assignmentStatus === 'UNASSIGNED') {
      return error(res, 'Assign a listing/vendor before confirming, or leave status Pending', 400);
    }

    const booking = await Booking.create({
      customer: customer._id,
      vendor: vendor || null,
      type: bookingType,
      serviceTenant,
      assignmentStatus,
      assignedAt: vendor ? new Date() : undefined,
      assignedBy: vendor ? req.user._id : undefined,
      bookingSource: source,
      status,
      checkIn: body.checkIn,
      checkOut: extra.checkOut,
      tentQuantity: extra.tentQuantity,
      guidePackage: extra.guidePackage,
      bikeAddon: extra.bikeAddon || false,
      taxiType: extra.taxiType,
      horseRouteId: extra.horseRouteId,
      subtotal: pricing.subtotal,
      gst: pricing.gst,
      total: pricing.total,
      paymentStatus: body.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
      notes: body.notes || `Created by admin (${source})`,
      ...listingFields,
    });

    await booking.populate('customer', 'name email phone');
    return success(res, booking, 'Booking created');
  } catch (err) {
    return error(res, err.message || 'Failed to create booking', err.status || 500);
  }
};

/** Admin confirms partner arrival (marks arrived + confirms in one step if needed). */
export const adminConfirmArrival = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return error(res, 'Booking not found', 404);
  if (!isTripServiceBooking(booking)) {
    return error(res, 'Only guide, taxi, driver and horse bookings support arrival', 400);
  }
  if (booking.assignmentStatus !== 'ASSIGNED' || !booking.vendor) {
    return error(res, 'Assign a vendor before confirming arrival', 400);
  }
  if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REFUNDED].includes(booking.status)) {
    return error(res, 'Cannot update a cancelled booking', 400);
  }
  if (isServiceEnded(booking)) return error(res, 'Booking already ended', 400);

  const now = new Date();
  if (!booking.vendorArrivedAt) {
    booking.vendorArrivedAt = now;
    booking.vendorArrivedBy = req.user._id;
  }
  booking.arrivalConfirmed = true;
  booking.arrivalConfirmedAt = now;
  booking.arrivalConfirmedBy = req.user._id;
  booking.guideReachedConfirmed = true;
  booking.guideReachedAt = now;
  booking.guideReachedBy = req.user._id;
  await booking.save();

  const label = serviceTripLabel(booking);
  if (booking.customer) {
    await createNotification({
      userId: booking.customer,
      title: `${label} arrival confirmed`,
      message: `Admin confirmed ${label.toLowerCase()} arrival for booking ${booking.bookingNumber}.`,
      type: 'BOOKING',
      link: '/dashboard/customer/bookings',
    });
  }
  if (booking.vendor) {
    await createNotification({
      userId: booking.vendor,
      title: 'Arrival confirmed by admin',
      message: `Admin confirmed your arrival for booking ${booking.bookingNumber}.`,
      type: 'BOOKING',
      link: '/dashboard/vendor/bookings',
    });
  }

  return success(res, booking, 'Arrival confirmed');
};

/** Admin confirms end booking with optional overtime (completes + invoice). */
export const adminConfirmEnd = async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    'customer vendor guide hotel tent driver homestay horse'
  );
  if (!booking) return error(res, 'Booking not found', 404);
  if (!isTripServiceBooking(booking)) {
    return error(res, 'Only guide, taxi, driver and horse bookings support end confirmation', 400);
  }
  if (booking.assignmentStatus !== 'ASSIGNED' || !booking.vendor) {
    return error(res, 'Assign a vendor before ending the booking', 400);
  }
  if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REFUNDED].includes(booking.status)) {
    return error(res, 'Cannot end a cancelled booking', 400);
  }
  if (isServiceEnded(booking)) return success(res, booking, 'Booking already ended');

  if (!isArrivalConfirmed(booking)) {
    const nowArr = new Date();
    booking.vendorArrivedAt = booking.vendorArrivedAt || nowArr;
    booking.arrivalConfirmed = true;
    booking.arrivalConfirmedAt = nowArr;
    booking.arrivalConfirmedBy = req.user._id;
    booking.guideReachedConfirmed = true;
    booking.guideReachedAt = nowArr;
  }

  const rawHours = Number(req.body?.overtimeHours);
  const overtimeHours = Number.isFinite(rawHours)
    ? Math.max(0, Math.round(rawHours * 100) / 100)
    : Number(booking.overtimeHours) || 0;
  const overtimeRate = SERVICE_OVERTIME_PER_HOUR;
  const overtimeAmount = Math.round(overtimeHours * overtimeRate);
  const packageSubtotal = Number(
    booking.packageSubtotal != null ? booking.packageSubtotal : booking.subtotal || 0
  );
  const subtotal = packageSubtotal + overtimeAmount;

  booking.packageSubtotal = packageSubtotal;
  booking.overtimeHours = overtimeHours;
  booking.overtimeAmount = overtimeAmount;
  booking.overtimeRatePerHour = overtimeRate;
  booking.subtotal = subtotal;
  booking.gst = 0;
  booking.total = subtotal;
  booking.endProposedAt = booking.endProposedAt || new Date();
  booking.endProposedBy = booking.endProposedBy || req.user._id;

  const now = new Date();
  booking.serviceEndedAt = now;
  booking.serviceEndedBy = req.user._id;
  booking.guideEndedAt = now;
  booking.guideEndedBy = req.user._id;
  booking.status = BOOKING_STATUS.COMPLETED;

  const listingName =
    booking.guide?.name ||
    booking.driver?.name ||
    booking.horse?.name ||
    serviceTripLabel(booking);

  try {
    const invoice = await generateInvoicePdf({
      booking,
      customer: booking.customer,
      vendor: booking.vendor,
      listingName,
      gstNumber: booking.hotel?.gstNumber || booking.homestay?.gstNumber,
    });
    booking.invoiceNumber = invoice.invoiceNumber;
    booking.invoiceUrl = invoice.invoiceUrl;
  } catch {
    /* non-blocking */
  }

  await booking.save();

  const label = serviceTripLabel(booking);
  const otNote =
    overtimeHours > 0 ? ` Overtime: ${overtimeHours} hr = ₹${overtimeAmount}.` : '';
  if (booking.customer) {
    await createNotification({
      userId: booking.customer._id || booking.customer,
      title: `${label} booking ended`,
      message: `Admin ended booking ${booking.bookingNumber}.${otNote}`,
      type: 'BOOKING',
      link: '/dashboard/customer/bookings',
    });
  }
  if (booking.vendor) {
    await createNotification({
      userId: booking.vendor._id || booking.vendor,
      title: 'Booking ended by admin',
      message: `Admin ended booking ${booking.bookingNumber}.${otNote}`,
      type: 'BOOKING',
      link: '/dashboard/vendor/bookings',
    });
  }

  return success(res, booking, 'Booking ended');
};

/** Admin emails booking invoice PDF to the customer. */
export const adminEmailInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      'customer vendor hotel tent guide driver homestay horse'
    );
    if (!booking) return error(res, 'Booking not found', 404);

    const toEmail =
      String(req.body?.email || '').trim() ||
      String(booking.customer?.email || '').trim() ||
      String(booking.guestRegistration?.leadGuest?.email || '').trim();
    if (!toEmail) {
      return error(res, 'Customer has no email. Enter an email to send the invoice.', 400);
    }

    const listingName =
      booking.hotel?.name ||
      booking.homestay?.name ||
      booking.tent?.name ||
      booking.guide?.name ||
      booking.driver?.name ||
      booking.horse?.name ||
      booking.type;

    const invoice = await generateInvoicePdf({
      booking,
      customer: booking.customer,
      vendor: booking.vendor,
      listingName,
      gstNumber: booking.hotel?.gstNumber || booking.homestay?.gstNumber,
    });
    booking.invoiceNumber = invoice.invoiceNumber;
    booking.invoiceUrl = invoice.invoiceUrl;
    await booking.save();

    const invoiceNo = invoice.invoiceNumber || booking.bookingNumber;
    await sendEmail({
      to: toEmail,
      subject: `Invoice ${invoiceNo} — Your Mahabaleshwar`,
      html: `
        <p>Hello ${booking.customer?.name || 'Guest'},</p>
        <p>Please find attached the invoice for booking <strong>${booking.bookingNumber}</strong>.</p>
        <p>Amount: <strong>₹${Number(booking.total || 0).toLocaleString('en-IN')}</strong></p>
        <p>Thank you for choosing Your Mahabaleshwar.</p>
      `,
      text: `Invoice ${invoiceNo} for booking ${booking.bookingNumber}. Amount: ₹${booking.total || 0}.`,
      attachments: [
        {
          filename: `${String(invoiceNo).replace(/[^\w.-]+/g, '_')}.pdf`,
          path: invoice.filePath,
        },
      ],
    });

    if (booking.customer) {
      await createNotification({
        userId: booking.customer._id || booking.customer,
        title: 'Invoice emailed',
        message: `Invoice ${invoiceNo} for booking ${booking.bookingNumber} was sent to ${toEmail}.`,
        type: 'BOOKING',
        link: '/dashboard/customer/bookings',
      });
    }

    return success(res, { invoiceUrl: booking.invoiceUrl, emailedTo: toEmail }, 'Invoice emailed');
  } catch (err) {
    return error(res, err.message || 'Failed to email invoice', 500);
  }
};

