import SubscriptionPlan from '../models/SubscriptionPlan.js';
import VendorSubscription from '../models/VendorSubscription.js';
import WalletTransaction from '../models/WalletTransaction.js';
import AdPackage from '../models/AdPackage.js';
import Advertisement from '../models/Advertisement.js';
import Campaign from '../models/Campaign.js';
import Payout from '../models/Payout.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Banner from '../models/Banner.js';
import Hotel from '../models/Hotel.js';
import Tent from '../models/Tent.js';
import Homestay from '../models/Homestay.js';
import Horse from '../models/Horse.js';
import Payment from '../models/Payment.js';
import { ROLES, VENDOR_ROLES } from '../constants/roles.js';
import { BOOKING_STATUS } from '../constants/booking.js';
import { success, error } from '../utils/apiResponse.js';
import {
  rechargePoints,
  creditWallet,
  debitWallet,
  getActiveSubscription,
  getPlatformMonetization,
} from '../services/walletService.js';
import { createNotification } from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';
import { sendSMS } from '../services/smsService.js';
import { sendWhatsApp } from '../services/whatsappService.js';
import { runBackup, listBackups, restoreBackupMeta } from '../services/backupService.js';

// ─── Subscriptions ───────────────────────────────────────────
export const listPlans = async (req, res) =>
  success(res, await SubscriptionPlan.find().sort('sortOrder'));

export const createPlan = async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);
  return success(res, plan, 'Plan created', 201);
};

export const updatePlan = async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) return error(res, 'Plan not found', 404);
  return success(res, plan);
};

export const assignSubscription = async (req, res) => {
  const { vendorId, planId, amountPaid = 0, paymentRef, autoRenew = false } = req.body;
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) return error(res, 'Plan not found', 404);
  const vendor = await User.findById(vendorId);
  if (!vendor) return error(res, 'Vendor not found', 404);

  await VendorSubscription.updateMany(
    { vendor: vendorId, status: 'ACTIVE' },
    { status: 'EXPIRED' }
  );

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

  const sub = await VendorSubscription.create({
    vendor: vendorId,
    plan: planId,
    status: 'ACTIVE',
    endDate,
    amountPaid,
    paymentRef,
    autoRenew,
  });

  if (plan.pointsIncluded > 0) {
    await rechargePoints({
      vendorId,
      points: plan.pointsIncluded,
      amountPaid: 0,
      paymentRef: `sub_${sub._id}`,
    });
  }

  await createNotification({
    userId: vendorId,
    title: 'Subscription activated',
    message: `${plan.name} is active until ${endDate.toLocaleDateString('en-IN')}.`,
    type: 'SYSTEM',
    email: vendor.email,
    sendMail: true,
  });

  return success(res, sub, 'Subscription assigned', 201);
};

export const listSubscriptions = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.vendorId) filter.vendor = req.query.vendorId;
  const items = await VendorSubscription.find(filter)
    .populate('vendor', 'name email phone role')
    .populate('plan')
    .sort('-createdAt')
    .limit(200);
  return success(res, items);
};

export const mySubscription = async (req, res) => {
  const sub = await getActiveSubscription(req.user._id);
  const monetization = await getPlatformMonetization();
  return success(res, {
    subscription: sub,
    pointBalance: req.user.pointBalance || 0,
    walletBalance: req.user.walletBalance || 0,
    monetization,
  });
};

export const purchasePoints = async (req, res) => {
  const { points, amountPaid = 0, paymentRef, vendorId } = req.body;
  const targetId =
    req.user.role === ROLES.SUPER_ADMIN && vendorId ? vendorId : req.user._id;
  if (!points || points < 1) return error(res, 'points required', 400);
  const tx = await rechargePoints({ vendorId: targetId, points, amountPaid, paymentRef });
  await createNotification({
    userId: targetId,
    title: 'Points recharged',
    message: `${points} points added to your account.`,
    type: 'PAYMENT',
  });
  return success(res, tx, 'Points added', 201);
};

// ─── Wallet / Commission / Payouts ────────────────────────────
export const getWallet = async (req, res) => {
  const vendorId =
    req.user.role === ROLES.SUPER_ADMIN && req.query.vendorId
      ? req.query.vendorId
      : req.user._id;
  const user = await User.findById(vendorId).select('name email walletBalance pointBalance role');
  const txs = await WalletTransaction.find({ vendor: vendorId }).sort('-createdAt').limit(100);
  return success(res, { user, transactions: txs });
};

export const generateVendorPayouts = async (req, res) => {
  const paidBookings = await Booking.find({
    paymentStatus: 'PAID',
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
    vendor: { $ne: null },
  }).select('vendor total commission _id');

  const existing = await Payout.find({ status: { $in: ['PENDING', 'PROCESSING', 'PAID'] } });
  const alreadyCovered = new Set();
  existing.forEach((p) => (p.bookings || []).forEach((b) => alreadyCovered.add(String(b))));

  const byVendor = {};
  for (const b of paidBookings) {
    if (alreadyCovered.has(String(b._id))) continue;
    const vid = String(b.vendor);
    if (!byVendor[vid]) byVendor[vid] = { bookings: [], amount: 0, commission: 0 };
    byVendor[vid].bookings.push(b._id);
    byVendor[vid].amount += b.total || 0;
    byVendor[vid].commission += b.commission || 0;
  }

  const created = [];
  for (const [vendorId, data] of Object.entries(byVendor)) {
    const netAmount = Math.max(0, data.amount - data.commission);
    if (netAmount <= 0) continue;
    const payout = await Payout.create({
      vendor: vendorId,
      amount: data.amount,
      commission: data.commission,
      netAmount,
      bookings: data.bookings,
      status: 'PENDING',
    });
    await creditWallet({
      vendorId,
      amount: netAmount,
      type: 'COMMISSION',
      description: `Settlement credit for ${data.bookings.length} bookings`,
      payout: payout._id,
    });
    created.push(payout);
  }

  return success(res, created, `Generated ${created.length} payouts`, 201);
};

export const updatePayoutStatus = async (req, res) => {
  const { status, transactionRef, notes } = req.body;
  const payout = await Payout.findById(req.params.id);
  if (!payout) return error(res, 'Payout not found', 404);

  payout.status = status;
  if (transactionRef) payout.transactionRef = transactionRef;
  if (notes) payout.notes = notes;
  if (status === 'PAID') {
    payout.paidAt = new Date();
    try {
      await debitWallet({
        vendorId: payout.vendor,
        amount: payout.netAmount,
        type: 'PAYOUT',
        description: `Payout paid ${payout.transactionRef || payout._id}`,
        payout: payout._id,
      });
    } catch {
      /* wallet may already be adjusted */
    }
    await createNotification({
      userId: payout.vendor,
      title: 'Payout completed',
      message: `INR ${payout.netAmount} has been paid out.`,
      type: 'PAYMENT',
    });
  }
  await payout.save();
  return success(res, payout);
};

export const listPayoutsDetailed = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await Payout.find(filter)
    .populate('vendor', 'name email phone walletBalance')
    .sort('-createdAt')
    .limit(200);
  return success(res, items);
};

// ─── Ads ─────────────────────────────────────────────────────
export const listAdPackages = async (req, res) =>
  success(res, await AdPackage.find().sort('price'));

export const createAdPackage = async (req, res) =>
  success(res, await AdPackage.create(req.body), 'Ad package created', 201);

export const updateAdPackage = async (req, res) => {
  const pkg = await AdPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!pkg) return error(res, 'Not found', 404);
  return success(res, pkg);
};

export const createAdvertisement = async (req, res) => {
  const { packageId, listingType, listingId, bannerId, title, vendorId, amountPaid = 0 } = req.body;
  const pkg = await AdPackage.findById(packageId);
  if (!pkg) return error(res, 'Package not found', 404);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (pkg.durationDays || 7));

  const ad = await Advertisement.create({
    vendor: vendorId || req.user._id,
    package: packageId,
    listingType,
    listingId,
    banner: bannerId,
    title: title || pkg.name,
    status: 'ACTIVE',
    startDate,
    endDate,
    amountPaid: amountPaid || pkg.price,
  });

  if (pkg.placement === 'FEATURED' && listingId) {
    const Model =
      listingType === 'TENT'
        ? Tent
        : listingType === 'HOMESTAY'
          ? Homestay
          : listingType === 'HORSE'
            ? Horse
            : Hotel;
    await Model.findByIdAndUpdate(listingId, { isFeatured: true });
  }

  if (pkg.placement === 'HOMEPAGE_BANNER' && bannerId) {
    await Banner.findByIdAndUpdate(bannerId, {
      isSponsored: true,
      startDate,
      endDate,
      isActive: true,
    });
  }

  return success(res, ad, 'Advertisement activated', 201);
};

export const listAdvertisements = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await Advertisement.find(filter)
    .populate('package')
    .populate('vendor', 'name email')
    .populate('banner')
    .sort('-createdAt')
    .limit(200);
  return success(res, items);
};

export const trackAdEvent = async (req, res) => {
  const { event } = req.body; // impression | click
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) return error(res, 'Not found', 404);
  if (event === 'click') ad.clicks += 1;
  else ad.impressions += 1;
  await ad.save();
  if (ad.banner) {
    const update = event === 'click' ? { $inc: { clicks: 1 } } : { $inc: { impressions: 1 } };
    await Banner.findByIdAndUpdate(ad.banner, update);
  }
  return success(res, ad);
};

export const adAnalytics = async (req, res) => {
  const agg = await Advertisement.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' },
        revenue: { $sum: '$amountPaid' },
      },
    },
  ]);
  const packages = await AdPackage.find({ isActive: true });
  return success(res, { byStatus: agg, packages });
};

export const listFeatured = async (req, res) => {
  const [hotels, tents, homestays, horses] = await Promise.all([
    Hotel.find({ isFeatured: true }).limit(50),
    Tent.find({ isFeatured: true }).limit(50),
    Homestay.find({ isFeatured: true }).limit(50),
    Horse.find({ isFeatured: true }).limit(50),
  ]);
  return success(res, { hotels, tents, homestays, horses });
};

export const setFeatured = async (req, res) => {
  const { listingType, listingId, isFeatured } = req.body;
  const Model =
    listingType === 'TENT'
      ? Tent
      : listingType === 'HOMESTAY'
        ? Homestay
        : listingType === 'HORSE'
          ? Horse
          : Hotel;
  const doc = await Model.findByIdAndUpdate(listingId, { isFeatured: !!isFeatured }, { new: true });
  if (!doc) return error(res, 'Listing not found', 404);
  return success(res, doc);
};

// ─── Marketing campaigns ─────────────────────────────────────
const resolveAudience = async (campaign) => {
  if (campaign.audience === 'ALL_VENDORS' || campaign.audience === 'VENDORS') {
    return User.find({ role: { $in: VENDOR_ROLES }, isActive: { $ne: false } }).select(
      'name email phone'
    );
  }
  if (campaign.audience === 'SEGMENT' && campaign.segmentRoles?.length) {
    return User.find({ role: { $in: campaign.segmentRoles } }).select('name email phone');
  }
  return User.find({ role: ROLES.CUSTOMER, isActive: { $ne: false } }).select('name email phone');
};

export const listCampaigns = async (req, res) =>
  success(res, await Campaign.find().populate('createdBy', 'name').sort('-createdAt').limit(100));

export const createCampaign = async (req, res) => {
  const campaign = await Campaign.create({ ...req.body, createdBy: req.user._id });
  return success(res, campaign, 'Campaign created', 201);
};

export const updateCampaign = async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!campaign) return error(res, 'Not found', 404);
  return success(res, campaign);
};

export const sendCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return error(res, 'Not found', 404);
  if (['SENT', 'SENDING'].includes(campaign.status)) {
    return error(res, 'Campaign already sent or in progress', 400);
  }

  campaign.status = 'SENDING';
  await campaign.save();

  const users = await resolveAudience(campaign);
  let sent = 0;
  let failed = 0;

  for (const u of users) {
    try {
      if (campaign.channel === 'EMAIL' && u.email) {
        await sendEmail({
          to: u.email,
          subject: campaign.subject || campaign.name,
          html: `<p>${campaign.message}</p>`,
        });
      } else if (campaign.channel === 'SMS' && u.phone) {
        await sendSMS({ phone: u.phone, message: campaign.message, userId: u._id });
      } else if (campaign.channel === 'WHATSAPP' && u.phone) {
        await sendWhatsApp({ phone: u.phone, message: campaign.message });
      } else {
        failed += 1;
        continue;
      }
      sent += 1;
      await createNotification({
        userId: u._id,
        title: campaign.name,
        message: campaign.message.slice(0, 200),
        type: 'PROMO',
      });
    } catch {
      failed += 1;
    }
  }

  campaign.status = failed && !sent ? 'FAILED' : 'SENT';
  campaign.sentAt = new Date();
  campaign.stats = { targeted: users.length, sent, failed };
  await campaign.save();
  return success(res, campaign, `Campaign sent to ${sent} recipients`);
};

// ─── Reports ─────────────────────────────────────────────────
export const getReportsHub = async (req, res) => {
  const { from, to } = req.query;
  const dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.$gte = new Date(from);
    if (to) dateFilter.createdAt.$lte = new Date(to);
  }

  const [bookings, payments, subscriptions, ads, refunds] = await Promise.all([
    Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
          gst: { $sum: '$gst' },
          commission: { $sum: '$commission' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]),
    VendorSubscription.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
    ]),
    Advertisement.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$amountPaid' },
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          $or: [{ status: BOOKING_STATUS.REFUNDED }, { refundStatus: { $in: ['COMPLETED', 'REQUESTED', 'PROCESSING'] } }],
        },
      },
      {
        $group: {
          _id: '$refundStatus',
          count: { $sum: 1 },
          amount: { $sum: '$refundAmount' },
        },
      },
    ]),
  ]);

  const gstTotal = bookings.reduce((s, b) => s + (b.gst || 0), 0);
  const revenueTotal = bookings.reduce((s, b) => s + (b.revenue || 0), 0);

  return success(res, {
    bookings,
    payments,
    subscriptions,
    advertisements: ads,
    refunds,
    gst: { total: gstTotal, byType: bookings },
    revenue: { total: revenueTotal, byType: bookings },
  });
};

// ─── Backups ─────────────────────────────────────────────────
export const triggerBackup = async (req, res) => {
  const { type = 'MANUAL', scope = 'FULL' } = req.body;
  try {
    const log = await runBackup({ type, scope, userId: req.user._id });
    return success(res, log, 'Backup completed', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const getBackups = async (req, res) => success(res, await listBackups());

export const restoreBackup = async (req, res) => {
  try {
    const result = await restoreBackupMeta(req.params.id);
    return success(res, result, 'Backup restored');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const seedPhase1bDefaults = async (req, res) => {
  const plans = [
    {
      name: 'Starter Monthly',
      code: 'STARTER',
      priceMonthly: 999,
      durationDays: 30,
      pointsIncluded: 50,
      description: 'Dashboard + limited marketing',
    },
    {
      name: 'Growth Monthly',
      code: 'GROWTH',
      priceMonthly: 2499,
      durationDays: 30,
      pointsIncluded: 200,
      unlimitedBookings: true,
      marketingAccess: true,
      description: 'Unlimited booking acceptance + marketing',
    },
  ];
  for (const p of plans) {
    await SubscriptionPlan.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true });
  }
  const adPkgs = [
    { name: 'Featured 7 days', code: 'FEAT7', price: 1499, durationDays: 7, placement: 'FEATURED' },
    { name: 'Homepage Banner 7 days', code: 'BANNER7', price: 2999, durationDays: 7, placement: 'HOMEPAGE_BANNER' },
    { name: 'Search Priority 14 days', code: 'SEARCH14', price: 1999, durationDays: 14, placement: 'SEARCH_PRIORITY' },
  ];
  for (const p of adPkgs) {
    await AdPackage.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true });
  }
  return success(res, { plans, adPkgs }, 'Defaults seeded');
};
