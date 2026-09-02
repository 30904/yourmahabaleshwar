import Hotel from '../models/Hotel.js';
import Homestay from '../models/Homestay.js';
import PlatformSettings from '../models/PlatformSettings.js';
import StayListingSubscription from '../models/StayListingSubscription.js';
import { APPROVAL_STATUS, resolveListingStatus } from '../utils/listingApproval.js';
import { createNotification } from './notificationService.js';
import { createOrder, verifyPaymentSignature } from './razorpayService.js';

export const STAY_LISTING_TYPES = new Set(['HOTEL', 'RESORT', 'HOMESTAY']);

const DAY_MS = 24 * 60 * 60 * 1000;

export function isStayListingType(type) {
  return STAY_LISTING_TYPES.has(String(type || '').toUpperCase());
}

export function publicStaySubscriptionFilter() {
  const now = new Date();
  return {
    subscriptionStatus: 'ACTIVE',
    subscriptionExpiresAt: { $gte: now },
  };
}

export function isListingPubliclyVisible(listing) {
  if (!listing || listing.isActive === false) return false;
  if (resolveListingStatus(listing) !== APPROVAL_STATUS.APPROVED) return false;
  if (listing.subscriptionStatus !== 'ACTIVE') return false;
  if (!listing.subscriptionExpiresAt) return false;
  return new Date(listing.subscriptionExpiresAt) >= new Date();
}

async function getListingModel(listingType) {
  if (listingType === 'HOMESTAY') return Homestay;
  return Hotel;
}

export async function getPlatformStaySettings() {
  const settings = await PlatformSettings.findOne({ key: 'default' });
  return {
    defaultRenewalPrice: settings?.stayListingDefaultRenewalPrice ?? 5000,
    warningDays: settings?.staySubscriptionWarningDays ?? 30,
  };
}

async function resolveRenewalPrice(listing) {
  if (listing?.renewalPrice != null && Number.isFinite(Number(listing.renewalPrice))) {
    return Number(listing.renewalPrice);
  }
  const { defaultRenewalPrice } = await getPlatformStaySettings();
  return defaultRenewalPrice;
}

async function syncListingSubscriptionFields(listing, { startDate, endDate, status, renewalPrice }) {
  listing.subscriptionStartedAt = startDate;
  listing.subscriptionExpiresAt = endDate;
  listing.subscriptionStatus = status;
  if (renewalPrice != null) listing.renewalPrice = renewalPrice;
  await listing.save();
}

export async function startSubscriptionOnApproval(listingType, listingId, { renewalPrice } = {}) {
  const type = String(listingType || '').toUpperCase();
  if (!isStayListingType(type)) return null;

  const Model = await getListingModel(type);
  const listing = await Model.findById(listingId);
  if (!listing) return null;

  if (
    listing.subscriptionStatus === 'ACTIVE' &&
    listing.subscriptionExpiresAt &&
    new Date(listing.subscriptionExpiresAt) > new Date()
  ) {
    return listing;
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const nextRenewalPrice =
    renewalPrice != null && Number.isFinite(Number(renewalPrice))
      ? Number(renewalPrice)
      : await resolveRenewalPrice(listing);

  await StayListingSubscription.updateMany(
    { listingId, listingType: type, status: 'ACTIVE' },
    { status: 'EXPIRED' }
  );

  const sub = await StayListingSubscription.create({
    listingType: type,
    listingId,
    vendor: listing.vendor,
    yearNumber: 1,
    startDate: now,
    endDate,
    amount: 0,
    isFreeYear: true,
    status: 'ACTIVE',
    renewalPrice: nextRenewalPrice,
  });

  await syncListingSubscriptionFields(listing, {
    startDate: now,
    endDate,
    status: 'ACTIVE',
    renewalPrice: nextRenewalPrice,
  });

  await createNotification({
    userId: listing.vendor,
    title: 'Free listing subscription started',
    message: `Your listing "${listing.name}" is live with a free 1-year subscription until ${endDate.toLocaleDateString('en-IN')}.`,
    type: 'SYSTEM',
  });

  return sub;
}

export async function setListingRenewalPrice(listingType, listingId, price) {
  const type = String(listingType || '').toUpperCase();
  if (!isStayListingType(type)) throw new Error('Invalid listing type');
  const parsed = Number(price);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Invalid renewal price');

  const Model = await getListingModel(type);
  const listing = await Model.findByIdAndUpdate(listingId, { renewalPrice: parsed }, { new: true });
  if (!listing) throw new Error('Listing not found');
  return listing;
}

async function countCompletedYears(listingId, listingType) {
  return StayListingSubscription.countDocuments({
    listingId,
    listingType,
    status: { $in: ['ACTIVE', 'EXPIRED'] },
  });
}

export async function renewStayListingSubscription(
  listingType,
  listingId,
  { paymentRef, amountPaid, notes, vendorId } = {}
) {
  const type = String(listingType || '').toUpperCase();
  if (!isStayListingType(type)) throw new Error('Invalid listing type');

  const Model = await getListingModel(type);
  const listing = await Model.findById(listingId);
  if (!listing) throw new Error('Listing not found');
  if (vendorId && String(listing.vendor) !== String(vendorId)) throw new Error('Forbidden');

  const previousYears = await countCompletedYears(listingId, type);
  const yearNumber = previousYears + 1;
  const renewalPrice = await resolveRenewalPrice(listing);
  const amount = yearNumber <= 1 ? 0 : renewalPrice;

  if (amount > 0 && !paymentRef) {
    throw new Error('Payment required for renewal');
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  await StayListingSubscription.updateMany(
    { listingId, listingType: type, status: { $in: ['ACTIVE', 'PENDING_PAYMENT'] } },
    { status: 'EXPIRED' }
  );

  const sub = await StayListingSubscription.create({
    listingType: type,
    listingId,
    vendor: listing.vendor,
    yearNumber,
    startDate: now,
    endDate,
    amount: amountPaid ?? amount,
    isFreeYear: amount <= 0,
    status: 'ACTIVE',
    renewalPrice,
    paymentRef,
    notes,
  });

  await syncListingSubscriptionFields(listing, {
    startDate: listing.subscriptionStartedAt || now,
    endDate,
    status: 'ACTIVE',
    renewalPrice,
  });

  await createNotification({
    userId: listing.vendor,
    title: 'Listing subscription renewed',
    message: `Your listing "${listing.name}" is live until ${endDate.toLocaleDateString('en-IN')}.`,
    type: 'SYSTEM',
  });

  return sub;
}

export async function createRenewalOrder(listingType, listingId, vendorId) {
  const type = String(listingType || '').toUpperCase();
  if (!isStayListingType(type)) throw new Error('Invalid listing type');

  const Model = await getListingModel(type);
  const listing = await Model.findById(listingId);
  if (!listing) throw new Error('Listing not found');
  if (String(listing.vendor) !== String(vendorId)) throw new Error('Forbidden');

  const previousYears = await countCompletedYears(listingId, type);
  const yearNumber = previousYears + 1;
  const amount = yearNumber <= 1 ? 0 : await resolveRenewalPrice(listing);

  if (amount <= 0) {
    const sub = await renewStayListingSubscription(type, listingId, { vendorId });
    return { amount: 0, renewed: true, subscription: sub };
  }

  const order = await createOrder(amount, `STAY-SUB-${String(listingId).slice(-8)}`, {
    listingType: type,
    listingId: String(listingId),
    vendorId: String(vendorId),
    purpose: 'STAY_LISTING_RENEWAL',
  });

  listing.subscriptionStatus = 'PENDING_PAYMENT';
  await listing.save();

  return {
    amount,
    yearNumber,
    order,
    keyId: process.env.RAZORPAY_KEY_ID || 'mock_key',
    listingName: listing.name,
  };
}

export async function confirmRenewalPayment(listingType, listingId, vendorId, paymentData) {
  const type = String(listingType || '').toUpperCase();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData || {};

  const valid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) throw new Error('Invalid payment signature');

  const Model = await getListingModel(type);
  const listing = await Model.findById(listingId);
  if (!listing) throw new Error('Listing not found');
  if (String(listing.vendor) !== String(vendorId)) throw new Error('Forbidden');

  const amount = await resolveRenewalPrice(listing);
  return renewStayListingSubscription(type, listingId, {
    vendorId,
    paymentRef: razorpayPaymentId || razorpayOrderId,
    amountPaid: amount,
  });
}

function mapSubscriptionRow(doc, listingType, warningDays) {
  const now = new Date();
  const expiresAt = doc.subscriptionExpiresAt ? new Date(doc.subscriptionExpiresAt) : null;
  const daysRemaining =
    expiresAt != null ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS)) : null;
  const endingSoon =
    doc.subscriptionStatus === 'ACTIVE' &&
    daysRemaining != null &&
    daysRemaining <= warningDays;

  return {
    listingId: doc._id,
    listingType,
    name: doc.name,
    slug: doc.slug,
    subscriptionStatus: doc.subscriptionStatus || 'NONE',
    subscriptionExpiresAt: doc.subscriptionExpiresAt,
    subscriptionStartedAt: doc.subscriptionStartedAt,
    renewalPrice: doc.renewalPrice,
    daysRemaining,
    endingSoon,
    isVisible: isListingPubliclyVisible(doc),
  };
}

export async function getVendorStaySubscriptions(vendorId) {
  const { warningDays } = await getPlatformStaySettings();
  const [hotels, homestays] = await Promise.all([
    Hotel.find({ vendor: vendorId, approvalStatus: APPROVAL_STATUS.APPROVED }).sort('-createdAt'),
    Homestay.find({ vendor: vendorId, approvalStatus: APPROVAL_STATUS.APPROVED }).sort('-createdAt'),
  ]);

  return [
    ...hotels.map((doc) => mapSubscriptionRow(doc, doc.type === 'RESORT' ? 'RESORT' : 'HOTEL', warningDays)),
    ...homestays.map((doc) => mapSubscriptionRow(doc, 'HOMESTAY', warningDays)),
  ];
}

export async function expireStayListingSubscriptions() {
  const now = new Date();
  const { warningDays } = await getPlatformStaySettings();
  const warnThreshold = new Date(now.getTime() + warningDays * DAY_MS);

  const expiringSoon = [];
  const processListing = async (listing, listingType) => {
    if (listing.subscriptionStatus !== 'ACTIVE' || !listing.subscriptionExpiresAt) return;

    const expiresAt = new Date(listing.subscriptionExpiresAt);
    if (expiresAt <= now) {
      listing.subscriptionStatus = 'EXPIRED';
      await listing.save();
      await StayListingSubscription.updateMany(
        { listingId: listing._id, listingType, status: 'ACTIVE' },
        { status: 'EXPIRED' }
      );
      await createNotification({
        userId: listing.vendor,
        title: 'Listing subscription expired',
        message: `Your listing "${listing.name}" is hidden from the website. Renew your subscription to go live again.`,
        type: 'SYSTEM',
      });
      return;
    }

    if (expiresAt <= warnThreshold && !listing.subscriptionExpiryWarningSentAt) {
      expiringSoon.push({ listing, listingType, expiresAt });
    }
  };

  const [hotels, homestays] = await Promise.all([
    Hotel.find({ subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: { $exists: true } }),
    Homestay.find({ subscriptionStatus: 'ACTIVE', subscriptionExpiresAt: { $exists: true } }),
  ]);

  for (const hotel of hotels) {
    await processListing(hotel, hotel.type === 'RESORT' ? 'RESORT' : 'HOTEL');
  }
  for (const homestay of homestays) {
    await processListing(homestay, 'HOMESTAY');
  }

  for (const { listing, expiresAt } of expiringSoon) {
    const daysLeft = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS));
    await createNotification({
      userId: listing.vendor,
      title: 'Listing subscription ending soon',
      message: `Your listing "${listing.name}" subscription ends in ${daysLeft} day(s). Renew to stay visible on the website.`,
      type: 'SYSTEM',
    });
    listing.subscriptionExpiryWarningSentAt = now;
    await listing.save();
  }
}

export async function backfillMissingStaySubscriptions() {
  const hotels = await Hotel.find({
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isActive: { $ne: false },
    subscriptionStatus: { $in: ['NONE', null] },
  });
  for (const hotel of hotels) {
    await startSubscriptionOnApproval(hotel.type, hotel._id);
  }

  const homestays = await Homestay.find({
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isActive: { $ne: false },
    subscriptionStatus: { $in: ['NONE', null] },
  });
  for (const homestay of homestays) {
    await startSubscriptionOnApproval('HOMESTAY', homestay._id);
  }
}

export async function maybeStartSubscriptionAfterCreate(listingType, doc) {
  if (!doc || resolveListingStatus(doc) !== APPROVAL_STATUS.APPROVED) return null;
  return startSubscriptionOnApproval(listingType, doc._id);
}
