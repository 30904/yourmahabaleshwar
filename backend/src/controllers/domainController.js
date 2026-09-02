import crypto from 'crypto';
import User from '../models/User.js';
import KYC from '../models/KYC.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import Tent from '../models/Tent.js';
import Guide from '../models/Guide.js';
import Driver from '../models/Driver.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Enquiry from '../models/Enquiry.js';
import Banner from '../models/Banner.js';
import FAQ from '../models/FAQ.js';
import DocumentRequirement from '../models/DocumentRequirement.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import GuidePackage from '../models/GuidePackage.js';
import Destination from '../models/Destination.js';
import TaxiHourlyPackage from '../models/TaxiHourlyPackage.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';
import { REFUND_STATUS, BOOKING_STATUS } from '../constants/booking.js';
import { success, error } from '../utils/apiResponse.js';
import { listAuditLogs } from '../middleware/audit.js';
import { createNotification } from '../services/notificationService.js';
import { computeRefundAmount } from './paymentController.js';
import {
  denyIfNotOwner,
  stampOwnerOnCreate,
  stripOwnerOnUpdate,
} from '../utils/vendorListingAccess.js';
import { APPROVAL_STATUS, denyIfVendorCannotEdit, stampPendingIfVendor } from '../utils/listingApproval.js';
import { maybeStartSubscriptionAfterCreate } from '../services/stayListingSubscriptionService.js';
import {
  mapDriverMine,
  mapGuideMine,
  mapHomestayMine,
  mapHorseMine,
  mapTentMine,
} from '../utils/vendorMineListings.js';

const slugify = (s) =>
  `${String(s || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

// ─── Users ───────────────────────────────────────────────────
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) return error(res, 'name, email, password required', 400);
    if (await User.findOne({ email })) return error(res, 'Email already exists', 400);
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role && Object.values(ROLES).includes(role) ? role : ROLES.CUSTOMER,
    });
    const obj = user.toObject();
    delete obj.password;
    return success(res, obj, 'User created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const updateUser = async (req, res) => {
  const allowed = ['name', 'phone', 'role', 'isActive', 'preferredLanguage', 'address', 'avatar'];
  const updates = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
  if (!user) return error(res, 'User not found', 404);
  return success(res, user);
};

export const resetUserPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return error(res, 'password min 6 chars', 400);
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return error(res, 'User not found', 404);
  user.password = password;
  await user.save();
  return success(res, null, 'Password reset');
};

// ─── Vendor registration ─────────────────────────────────────
export const registerVendor = async (req, res) => {
  try {
    const { name, email, phone, password, vendorType, businessName } = req.body;
    const roleMap = {
      HOTEL: ROLES.HOTEL_VENDOR,
      RESORT: ROLES.HOTEL_VENDOR,
      HOMESTAY: ROLES.HOMESTAY_VENDOR,
      TENT: ROLES.TENT_OPERATOR,
      GUIDE: ROLES.GUIDE,
      TAXI: ROLES.TAXI_OPERATOR,
      DRIVER: ROLES.DRIVER,
      HORSE: ROLES.HORSE_OPERATOR,
      PRODUCT: ROLES.PRODUCT_VENDOR,
      STRAWBERRY: ROLES.PRODUCT_VENDOR,
      MAPRO: ROLES.PRODUCT_VENDOR,
    };
    const role = roleMap[vendorType] || ROLES.HOTEL_VENDOR;
    if (!name || !email || !password) return error(res, 'name, email, password required', 400);
    if (await User.findOne({ email })) return error(res, 'Email already registered', 400);
    // Active so vendor can log in and upload KYC; go-live gated by KYC APPROVED
    const user = await User.create({ name, email, phone, password, role, isActive: true });
    await KYC.create({
      user: user._id,
      vendorType: vendorType || 'HOTEL',
      status: 'PENDING',
    });

    const { createAndSendOtp } = await import('../services/otpService.js');
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
      title: 'Vendor registration received',
      message: 'Verify OTP, then upload KYC. Admin will approve after verification.',
      type: 'KYC',
      email,
      sendMail: true,
    });
    return success(
      res,
      {
        userId: user._id,
        role,
        businessName,
        status: 'PENDING_KYC',
        email,
        phone,
        requiresOtp: true,
        ...otpPayload,
      },
      'Vendor registered. Verify OTP, then complete KYC.',
      201
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const adminCreateVendor = async (req, res) => {
  try {
    const { name, email, phone, role, password, tempPassword } = req.body;
    if (!VENDOR_ROLES.includes(role) && role !== ROLES.HOTEL_VENDOR) {
      return error(res, 'Invalid vendor role', 400);
    }
    if (await User.findOne({ email })) return error(res, 'Email exists', 400);
    const pwd = password || tempPassword || `Temp@${crypto.randomBytes(3).toString('hex')}`;
    const user = await User.create({
      name,
      email,
      phone,
      password: pwd,
      role,
      isActive: true,
    });
    await KYC.create({ user: user._id, status: 'PENDING' });
    await createNotification({
      userId: user._id,
      title: 'Vendor account created',
      message: `Your account was created by admin. Temporary password: ${pwd}. Please login and complete profile/KYC.`,
      type: 'KYC',
      email,
      sendMail: true,
    });
    const obj = user.toObject();
    delete obj.password;
    return success(res, { user: obj, temporaryPassword: pwd }, 'Vendor created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const submitKyc = async (req, res) => {
  const payload = { ...req.body, user: req.user._id, status: 'PENDING' };

  // Attach uploaded files as /uploads/<filename>
  if (req.files) {
    const fileFields = [
      'aadharDoc',
      'panDoc',
      'rcDoc',
      'pucDoc',
      'insuranceDoc',
      'licenseDoc',
      'addressProofDoc',
      'gstDoc',
      'businessRegDoc',
      'hotelLicenseDoc',
      'guideLicenseDoc',
      'fitnessDoc',
      'permitDoc',
      'bankProofDoc',
    ];
    for (const field of fileFields) {
      if (req.files[field]?.[0]) {
        payload[field] = `/uploads/${req.files[field][0].filename}`;
      }
    }
  }

  if (typeof payload.bankDetails === 'string') {
    try {
      payload.bankDetails = JSON.parse(payload.bankDetails);
    } catch {
      /* keep string */
    }
  }

  let kyc = await KYC.findOne({ user: req.user._id });
  if (kyc) {
    Object.assign(kyc, payload);
    kyc.status = 'PENDING';
    await kyc.save();
  } else {
    kyc = await KYC.create(payload);
  }
  return success(res, kyc, 'KYC submitted');
};

export const getMyKyc = async (req, res) => {
  const kyc = await KYC.findOne({ user: req.user._id });
  return success(res, kyc);
};

export const getDocumentRequirements = async (req, res) => {
  const { vendorType } = req.query;
  if (vendorType) {
    const one = await DocumentRequirement.findOne({ vendorType });
    return success(res, one);
  }
  return success(res, await DocumentRequirement.find());
};

export const upsertDocumentRequirement = async (req, res) => {
  const { vendorType, requiredDocs } = req.body;
  const doc = await DocumentRequirement.findOneAndUpdate(
    { vendorType },
    { vendorType, requiredDocs },
    { upsert: true, new: true }
  );
  return success(res, doc);
};

export const seedDocumentRequirements = async (req, res) => {
  const defaults = {
    HOTEL: [
      { code: 'GST', label: 'GST Certificate' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'BANK', label: 'Bank Details' },
      { code: 'BUSINESS_REG', label: 'Business Registration Certificate' },
      { code: 'HOTEL_LICENSE', label: 'Hotel License' },
    ],
    RESORT: [
      { code: 'GST', label: 'GST Certificate' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'BANK', label: 'Bank Details' },
      { code: 'BUSINESS_REG', label: 'Business Registration Certificate' },
    ],
    HOMESTAY: [
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'ADDRESS', label: 'Address Proof' },
      { code: 'BANK', label: 'Bank Details' },
    ],
    GUIDE: [
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'GUIDE_LICENSE', label: 'Guide License' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'BANK', label: 'Bank Details' },
    ],
    TAXI: [
      { code: 'RC', label: 'Vehicle RC' },
      { code: 'INSURANCE', label: 'Vehicle Insurance' },
      { code: 'FITNESS', label: 'Fitness Certificate' },
      { code: 'PERMIT', label: 'Permit' },
      { code: 'LICENSE', label: 'Driving License' },
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'BANK', label: 'Bank Details' },
    ],
    TENT: [
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'BANK', label: 'Bank Details' },
    ],
    HORSE: [
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'BANK', label: 'Bank Details' },
    ],
    DRIVER: [
      { code: 'LICENSE', label: 'Driving License' },
      { code: 'AADHAAR', label: 'Aadhaar Card' },
      { code: 'PAN', label: 'PAN Card' },
      { code: 'BANK', label: 'Bank Details' },
    ],
  };
  const saved = [];
  for (const [vendorType, requiredDocs] of Object.entries(defaults)) {
    saved.push(
      await DocumentRequirement.findOneAndUpdate(
        { vendorType },
        { vendorType, requiredDocs },
        { upsert: true, new: true }
      )
    );
  }
  return success(res, saved, 'Document requirements seeded');
};

// ─── Listing CRUD helpers ────────────────────────────────────
const crudCreate = (Model, ownerField) => async (req, res) => {
  try {
    const data = stampOwnerOnCreate(req, { ...req.body }, ownerField);
    if (!data.slug && data.name) data.slug = slugify(data.name);
    const doc = await Model.create(data);
    return success(res, doc, 'Created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const crudUpdate = (Model, ownerField, { requireApproved } = {}) => async (req, res) => {
  const doc = await Model.findById(req.params.id);
  if (!doc) return error(res, 'Not found', 404);
  const denied = denyIfNotOwner(req, doc, ownerField);
  if (denied) return error(res, denied.message, denied.status);
  if (requireApproved) {
    const blocked = denyIfVendorCannotEdit(req, doc);
    if (blocked) return error(res, blocked.message, blocked.status);
  }
  Object.assign(doc, stripOwnerOnUpdate(req, req.body, ownerField));
  await doc.save();
  return success(res, doc);
};

const crudDelete = (Model, ownerField) => async (req, res) => {
  const doc = await Model.findById(req.params.id);
  if (!doc) return error(res, 'Not found', 404);
  const denied = denyIfNotOwner(req, doc, ownerField);
  if (denied) return error(res, denied.message, denied.status);
  doc.isActive = false;
  if (doc.approvalStatus === APPROVAL_STATUS.APPROVED) doc.approvalStatus = APPROVAL_STATUS.REJECTED;
  await doc.save();
  return success(res, null, 'Deactivated');
};

const crudListMine = (Model, ownerField, mapFn) => async (req, res) => {
  const filter = req.user.role === ROLES.SUPER_ADMIN ? {} : { [ownerField]: req.user._id };
  const docs = await Model.find(filter).sort('-createdAt').limit(200);
  return success(res, mapFn ? docs.map(mapFn) : docs);
};

const crudGetMine = (Model, ownerField) => async (req, res) => {
  const doc = await Model.findById(req.params.id);
  if (!doc) return error(res, 'Not found', 404);
  const denied = denyIfNotOwner(req, doc, ownerField);
  if (denied) return error(res, denied.message, denied.status);
  return success(res, doc);
};

export const createHomestay = async (req, res) => {
  req.body = stampPendingIfVendor(req, req.body);
  try {
    const data = stampOwnerOnCreate(req, { ...req.body }, 'vendor');
    if (!data.slug && data.name) data.slug = slugify(data.name);
    const doc = await Homestay.create(data);
    await maybeStartSubscriptionAfterCreate('HOMESTAY', doc);
    return success(res, doc, 'Created', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};
export const updateHomestay = crudUpdate(Homestay, 'vendor', { requireApproved: true });
export const deleteHomestay = crudDelete(Homestay, 'vendor');
export const listMyHomestays = crudListMine(Homestay, 'vendor', mapHomestayMine);
export const getMyHomestay = crudGetMine(Homestay, 'vendor');

export const createHorse = async (req, res) => {
  req.body = stampPendingIfVendor(req, req.body);
  return crudCreate(Horse, 'operator')(req, res);
};
export const updateHorse = crudUpdate(Horse, 'operator', { requireApproved: true });
export const deleteHorse = crudDelete(Horse, 'operator');
export const listMyHorses = crudListMine(Horse, 'operator', mapHorseMine);
export const getMyHorse = crudGetMine(Horse, 'operator');

export const createTent = async (req, res) => {
  req.body = stampPendingIfVendor(req, req.body);
  return crudCreate(Tent, 'operator')(req, res);
};
export const updateTent = crudUpdate(Tent, 'operator', { requireApproved: true });
export const deleteTent = crudDelete(Tent, 'operator');
export const listMyTents = crudListMine(Tent, 'operator', mapTentMine);
export const getMyTent = crudGetMine(Tent, 'operator');

export const createGuide = async (req, res) => {
  req.body = stampPendingIfVendor(req, req.body);
  return crudCreate(Guide, 'user')(req, res);
};
export const updateGuide = crudUpdate(Guide, 'user', { requireApproved: true });
export const deleteGuide = crudDelete(Guide, 'user');
export const listMyGuides = crudListMine(Guide, 'user', mapGuideMine);
export const getMyGuide = crudGetMine(Guide, 'user');

export const createDriver = async (req, res) => {
  req.body = stampPendingIfVendor(req, req.body);
  return crudCreate(Driver, 'user')(req, res);
};
export const updateDriver = crudUpdate(Driver, 'user', { requireApproved: true });
export const deleteDriver = crudDelete(Driver, 'user');
export const listMyDrivers = crudListMine(Driver, 'user', mapDriverMine);
export const getMyDriver = crudGetMine(Driver, 'user');

export const listAdminHomestays = async (req, res) =>
  success(res, await Homestay.find().populate('vendor', 'name email phone').sort('-createdAt').limit(200));
export const listAdminHorses = async (req, res) =>
  success(res, await Horse.find().populate('operator', 'name email phone').sort('-createdAt').limit(200));
export const listAdminTents = async (req, res) =>
  success(res, await Tent.find().populate('operator', 'name email phone').sort('-createdAt').limit(200));

// ─── Seasonal pricing ────────────────────────────────────────
export const updateRoomSeasonal = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return error(res, 'Room not found', 404);
  room.seasonalPricing = req.body.seasonalPricing || [];
  await room.save();
  return success(res, room);
};

// ─── Guide packages / taxi hourly / destinations ─────────────
export const listGuidePackages = async (req, res) => {
  const filter = {};
  if (req.query.guideId) filter.guide = req.query.guideId;
  if (req.query.global === 'true') filter.isGlobal = true;
  // Admin lists all; pass ?active=true for public/end-user consumers
  if (req.query.active === 'true') filter.isActive = { $ne: false };
  return success(res, await GuidePackage.find(filter).sort('durationHours'));
};
export const createGuidePackage = async (req, res) =>
  success(res, await GuidePackage.create(req.body), 'Created', 201);
export const updateGuidePackage = async (req, res) => {
  const doc = await GuidePackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return error(res, 'Not found', 404);
  return success(res, doc);
};
export const deleteGuidePackage = async (req, res) => {
  await GuidePackage.findByIdAndDelete(req.params.id);
  return success(res, null, 'Deleted');
};

export const listTaxiHourlyPackages = async (req, res) => {
  // Admin list shows all; public callers can pass ?active=true
  const filter = req.query.active === 'true' ? { isActive: { $ne: false } } : {};
  return success(res, await TaxiHourlyPackage.find(filter).sort('-createdAt'));
};
export const createTaxiHourlyPackage = async (req, res) =>
  success(res, await TaxiHourlyPackage.create(req.body), 'Created', 201);
export const updateTaxiHourlyPackage = async (req, res) => {
  const doc = await TaxiHourlyPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return error(res, 'Not found', 404);
  return success(res, doc);
};

export const listDestinations = async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: { $ne: false } };
  return success(res, await Destination.find(filter).sort('-popularityScore'));
};
export const createDestination = async (req, res) =>
  success(res, await Destination.create(req.body), 'Created', 201);
export const updateDestination = async (req, res) => {
  const doc = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return error(res, 'Not found', 404);
  return success(res, doc);
};
export const deleteDestination = async (req, res) => {
  await Destination.findByIdAndDelete(req.params.id);
  return success(res, null, 'Deleted');
};
export const destinationsAnalytics = async (req, res) => {
  const destinations = await Destination.find({ isActive: true }).sort('-popularityScore').limit(50);
  const hotelsByCity = await Hotel.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$address.city', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
  return success(res, { destinations, hotelsByCity });
};

// ─── Notification templates ──────────────────────────────────
export const listNotificationTemplates = async (req, res) =>
  success(res, await NotificationTemplate.find().sort('key'));
export const upsertNotificationTemplate = async (req, res) => {
  const { key } = req.body;
  if (!key) return error(res, 'key required', 400);
  const doc = await NotificationTemplate.findOneAndUpdate(
    { key: String(key).toUpperCase() },
    { ...req.body, key: String(key).toUpperCase() },
    { upsert: true, new: true }
  );
  return success(res, doc);
};
export const seedNotificationTemplates = async (req, res) => {
  const templates = [
    { key: 'BOOKING_CONFIRMED', name: 'Booking confirmed', channel: 'IN_APP', body: 'Booking {{bookingNumber}} is confirmed.' },
    { key: 'PAYMENT_SUCCESS', name: 'Payment success', channel: 'EMAIL', subject: 'Payment received', body: 'Payment of INR {{amount}} received for {{bookingNumber}}.' },
    { key: 'REFUND_STATUS', name: 'Refund status', channel: 'SMS', body: 'Refund {{status}} for {{bookingNumber}}: INR {{amount}}' },
    { key: 'VENDOR_APPROVED', name: 'Vendor approved', channel: 'EMAIL', subject: 'KYC approved', body: 'Your vendor account is approved.' },
    { key: 'SUBSCRIPTION_EXPIRY', name: 'Subscription expiry', channel: 'IN_APP', body: 'Your subscription expires on {{endDate}}.' },
    { key: 'OTP', name: 'OTP', channel: 'SMS', body: 'Your OTP is {{code}}. Valid for 10 minutes.' },
  ];
  const saved = [];
  for (const t of templates) {
    saved.push(
      await NotificationTemplate.findOneAndUpdate({ key: t.key }, t, { upsert: true, new: true })
    );
  }
  return success(res, saved, 'Templates seeded');
};

// ─── Payments / refunds admin ────────────────────────────────
export const listPayments = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await Payment.find(filter)
    .populate('user', 'name email')
    .populate('booking', 'bookingNumber total type')
    .sort('-createdAt')
    .limit(200);
  return success(res, items);
};

export const listRefunds = async (req, res) => {
  const filter = {
    refundStatus: { $in: Object.values(REFUND_STATUS).filter((s) => s !== 'NONE') },
  };
  if (req.query.status) filter.refundStatus = req.query.status;
  const items = await Booking.find(filter)
    .populate('customer', 'name email phone')
    .populate('vendor', 'name email')
    .sort('-updatedAt')
    .limit(200);
  return success(res, items);
};

export const moderateRefund = async (req, res) => {
  const { action, reason } = req.body; // approve | reject
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return error(res, 'Booking not found', 404);
  if (action === 'reject') {
    booking.refundStatus = REFUND_STATUS.REJECTED;
    booking.refundReason = reason || booking.refundReason;
    await booking.save();
    await createNotification({
      userId: booking.customer,
      title: 'Refund rejected',
      message: reason || 'Your refund request was rejected.',
      type: 'PAYMENT',
    });
    return success(res, booking, 'Refund rejected');
  }
  // approve — reuse payment refund flow by setting REQUESTED and calling compute
  const preview = await computeRefundAmount(booking);
  booking.refundStatus = REFUND_STATUS.REQUESTED;
  booking.refundAmount = preview.amount;
  await booking.save();
  return success(res, { booking, preview }, 'Refund approved for processing — use POST /payments/refund');
};

// ─── CMS finishers ───────────────────────────────────────────
export const updateBanner = async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) return error(res, 'Not found', 404);
  return success(res, banner);
};
export const deleteBanner = async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  return success(res, null, 'Deleted');
};
export const updateFaq = async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) return error(res, 'Not found', 404);
  return success(res, faq);
};
export const deleteFaq = async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  return success(res, null, 'Deleted');
};

// ─── Enquiries ───────────────────────────────────────────────
export const getEnquiry = async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) return error(res, 'Not found', 404);
  return success(res, enquiry);
};
export const deleteEnquiry = async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.id);
  return success(res, null, 'Deleted');
};

// ─── Audit ───────────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  const logs = await listAuditLogs({
    limit: req.query.limit || 100,
    actor: req.query.actor,
    resource: req.query.resource,
  });
  return success(res, logs);
};

// ─── Commission matrix ───────────────────────────────────────
export const getCommissionRates = async (req, res) => {
  const [hotels, tents, guides, drivers, homestays, horses] = await Promise.all([
    Hotel.find().select('name type commissionRate').limit(100),
    Tent.find().select('name commissionRate').limit(100),
    Guide.find().select('name commissionRate').limit(100),
    Driver.find().select('name commissionRate').limit(100),
    Homestay.find().select('name commissionRate').limit(100),
    Horse.find().select('name commissionRate').limit(100),
  ]);
  return success(res, { hotels, tents, guides, drivers, homestays, horses });
};

export const updateListingCommission = async (req, res) => {
  const { listingType, listingId, commissionRate } = req.body;
  const Model =
    listingType === 'TENT'
      ? Tent
      : listingType === 'GUIDE'
        ? Guide
        : listingType === 'TAXI' || listingType === 'DRIVER'
          ? Driver
          : listingType === 'HOMESTAY'
            ? Homestay
            : listingType === 'HORSE'
              ? Horse
              : Hotel;
  const doc = await Model.findByIdAndUpdate(listingId, { commissionRate }, { new: true });
  if (!doc) return error(res, 'Not found', 404);
  return success(res, doc);
};
