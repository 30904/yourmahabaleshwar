import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import VendorSubscription from '../models/VendorSubscription.js';
import PlatformSettings from '../models/PlatformSettings.js';
import { createNotification } from './notificationService.js';

export const getPlatformMonetization = async () => {
  const settings = await PlatformSettings.findOne({ key: 'default' });
  return {
    mode: settings?.vendorMonetizationMode || 'BOTH',
    pointsPerBooking: settings?.pointsPerBooking ?? 10,
    lowPointThreshold: settings?.lowPointThreshold ?? 20,
    pointRechargeRate: settings?.pointRechargeRate ?? 1,
  };
};

export const getActiveSubscription = async (vendorId) =>
  VendorSubscription.findOne({
    vendor: vendorId,
    status: 'ACTIVE',
    endDate: { $gt: new Date() },
  }).populate('plan');

/**
 * Vendor may accept bookings if they have an active subscription OR enough points.
 */
export const canVendorAcceptBooking = async (vendorId) => {
  const { mode, pointsPerBooking, lowPointThreshold } = await getPlatformMonetization();
  const vendor = await User.findById(vendorId);
  if (!vendor) return { ok: false, reason: 'Vendor not found' };

  const sub = await getActiveSubscription(vendorId);
  const hasSub = Boolean(sub);
  const hasPoints = (vendor.pointBalance || 0) >= pointsPerBooking;

  if (mode === 'SUBSCRIPTION') {
    if (!hasSub) return { ok: false, reason: 'Active subscription required' };
    return { ok: true, via: 'SUBSCRIPTION', subscription: sub };
  }
  if (mode === 'POINTS') {
    if (!hasPoints) return { ok: false, reason: 'Insufficient points', points: vendor.pointBalance };
    return { ok: true, via: 'POINTS' };
  }
  // BOTH — either is fine
  if (hasSub) return { ok: true, via: 'SUBSCRIPTION', subscription: sub };
  if (hasPoints) return { ok: true, via: 'POINTS' };
  return { ok: false, reason: 'Need active subscription or points', points: vendor.pointBalance };
};

export const deductPointsForBooking = async (vendorId, bookingId) => {
  const { pointsPerBooking, lowPointThreshold } = await getPlatformMonetization();
  const vendor = await User.findById(vendorId);
  if (!vendor) return null;

  const sub = await getActiveSubscription(vendorId);
  if (sub?.plan?.unlimitedBookings) {
    return { skipped: true, reason: 'Unlimited via subscription' };
  }

  if ((vendor.pointBalance || 0) < pointsPerBooking) {
    return { ok: false, reason: 'Insufficient points' };
  }

  vendor.pointBalance -= pointsPerBooking;
  await vendor.save();

  await WalletTransaction.create({
    vendor: vendorId,
    type: 'POINTS_DEDUCT',
    points: -pointsPerBooking,
    pointsAfter: vendor.pointBalance,
    balanceAfter: vendor.walletBalance,
    booking: bookingId,
    description: `Points deducted for booking acceptance (${pointsPerBooking})`,
  });

  if (vendor.pointBalance <= lowPointThreshold) {
    await createNotification({
      userId: vendorId,
      title: 'Low point balance',
      message: `Your point balance is ${vendor.pointBalance}. Recharge to keep accepting bookings.`,
      type: 'SYSTEM',
      link: '/dashboard/vendor',
    });
  }

  return { ok: true, pointsAfter: vendor.pointBalance };
};

export const creditWallet = async ({ vendorId, amount, type = 'CREDIT', description, booking, payout, metadata }) => {
  const vendor = await User.findById(vendorId);
  if (!vendor) throw new Error('Vendor not found');
  vendor.walletBalance = (vendor.walletBalance || 0) + amount;
  await vendor.save();
  return WalletTransaction.create({
    vendor: vendorId,
    type,
    amount,
    balanceAfter: vendor.walletBalance,
    pointsAfter: vendor.pointBalance,
    booking,
    payout,
    description,
    metadata,
  });
};

export const debitWallet = async ({ vendorId, amount, type = 'DEBIT', description, payout, metadata }) => {
  const vendor = await User.findById(vendorId);
  if (!vendor) throw new Error('Vendor not found');
  if ((vendor.walletBalance || 0) < amount) throw new Error('Insufficient wallet balance');
  vendor.walletBalance -= amount;
  await vendor.save();
  return WalletTransaction.create({
    vendor: vendorId,
    type,
    amount: -amount,
    balanceAfter: vendor.walletBalance,
    pointsAfter: vendor.pointBalance,
    payout,
    description,
    metadata,
  });
};

export const rechargePoints = async ({ vendorId, points, amountPaid = 0, paymentRef }) => {
  const vendor = await User.findById(vendorId);
  if (!vendor) throw new Error('Vendor not found');
  vendor.pointBalance = (vendor.pointBalance || 0) + points;
  await vendor.save();
  return WalletTransaction.create({
    vendor: vendorId,
    type: 'POINTS_PURCHASE',
    points,
    amount: amountPaid,
    pointsAfter: vendor.pointBalance,
    balanceAfter: vendor.walletBalance,
    description: `Purchased ${points} points`,
    metadata: { paymentRef },
  });
};
