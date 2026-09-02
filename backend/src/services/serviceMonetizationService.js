import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import VendorSubscription from '../models/VendorSubscription.js';
import PlatformSettings from '../models/PlatformSettings.js';
import {
  DEFAULT_SERVICE_MONETIZATION,
  SERVICE_TENANTS,
  serviceTenantForBooking,
  serviceTenantForRole,
} from '../constants/serviceMonetization.js';
import { createNotification } from './notificationService.js';
import { createOrder, verifyPaymentSignature } from './razorpayService.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getServiceMonetizationConfig(tenantType) {
  const tenant = String(tenantType || '').toUpperCase();
  const settings = await PlatformSettings.findOne({ key: 'default' });
  const stored = settings?.serviceMonetization?.[tenant] || {};
  return { ...DEFAULT_SERVICE_MONETIZATION[tenant], ...stored };
}

export async function getAllServiceMonetizationConfig() {
  const entries = await Promise.all(SERVICE_TENANTS.map(async (tenant) => [tenant, await getServiceMonetizationConfig(tenant)]));
  return Object.fromEntries(entries);
}

export async function updateServiceMonetizationConfig(tenantType, patch) {
  const tenant = String(tenantType || '').toUpperCase();
  if (!SERVICE_TENANTS.includes(tenant)) throw new Error('Invalid tenant type');
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: Object.fromEntries(Object.entries(patch).map(([k, v]) => [`serviceMonetization.${tenant}.${k}`, v])) },
    { upsert: true, new: true }
  );
  return getServiceMonetizationConfig(tenant);
}

export async function getActiveUnlimitedSubscription(vendorId, tenantType) {
  const tenant = String(tenantType || '').toUpperCase();
  return VendorSubscription.findOne({
    vendor: vendorId,
    tenantType: tenant,
    unlimitedBookings: true,
    status: 'ACTIVE',
    endDate: { $gt: new Date() },
  });
}

export async function getServiceMonetizationStatus(vendorId, tenantType) {
  const tenant = tenantType || (await User.findById(vendorId))?.role;
  const resolvedTenant = serviceTenantForRole(tenant) || String(tenantType || '').toUpperCase();
  if (!SERVICE_TENANTS.includes(resolvedTenant)) {
    return { supported: false };
  }

  const config = await getServiceMonetizationConfig(resolvedTenant);
  const vendor = await User.findById(vendorId);
  const points = vendor?.pointBalance || 0;
  const unlimited = await getActiveUnlimitedSubscription(vendorId, resolvedTenant);
  const hasUnlimited = Boolean(unlimited);
  const hasPoints = points >= config.pointsPerBooking;
  const canAccept = hasUnlimited || hasPoints;
  const daysRemaining = unlimited
    ? Math.max(0, Math.ceil((new Date(unlimited.endDate).getTime() - Date.now()) / DAY_MS))
    : null;
  const endingSoon =
    hasUnlimited && daysRemaining != null && daysRemaining <= (config.unlimitedWarningDays || 7);
  const lowPoints = !hasUnlimited && points <= (config.lowPointThreshold || 20);
  const insufficientPoints = !hasUnlimited && points < config.pointsPerBooking;

  return {
    supported: true,
    tenantType: resolvedTenant,
    pointBalance: points,
    pointsPerBooking: config.pointsPerBooking,
    rupeesPerPoint: config.rupeesPerPoint,
    unlimitedMonthlyPrice: config.unlimitedMonthlyPrice,
    lowPointThreshold: config.lowPointThreshold,
    hasUnlimited,
    unlimitedExpiresAt: unlimited?.endDate || null,
    unlimitedDaysRemaining: daysRemaining,
    endingSoon,
    lowPoints,
    insufficientPoints,
    canAcceptBookings: canAccept,
    activeVia: hasUnlimited ? 'UNLIMITED' : hasPoints ? 'POINTS' : 'NONE',
  };
}

export async function canServiceVendorAcceptBooking(vendorId, booking) {
  const tenant = serviceTenantForBooking(booking) || serviceTenantForRole((await User.findById(vendorId))?.role);
  if (!tenant) return { ok: true, via: 'NONE' };

  const status = await getServiceMonetizationStatus(vendorId, tenant);
  if (!status.supported) return { ok: true, via: 'NONE' };
  if (status.hasUnlimited) return { ok: true, via: 'UNLIMITED', tenantType: tenant };
  if (status.pointBalance >= status.pointsPerBooking) {
    return { ok: true, via: 'POINTS', tenantType: tenant, pointsPerBooking: status.pointsPerBooking };
  }
  return {
    ok: false,
    reason: 'Insufficient points — recharge to accept bookings',
    tenantType: tenant,
    points: status.pointBalance,
    pointsRequired: status.pointsPerBooking,
  };
}

export async function deductServicePointsForBooking(vendorId, booking) {
  const tenant = serviceTenantForBooking(booking);
  if (!tenant) return { skipped: true, reason: 'Not a service booking' };

  const unlimited = await getActiveUnlimitedSubscription(vendorId, tenant);
  if (unlimited) return { skipped: true, reason: 'Unlimited subscription active' };

  const config = await getServiceMonetizationConfig(tenant);
  const vendor = await User.findById(vendorId);
  if (!vendor) return { ok: false, reason: 'Vendor not found' };
  if ((vendor.pointBalance || 0) < config.pointsPerBooking) {
    return { ok: false, reason: 'Insufficient points' };
  }

  vendor.pointBalance -= config.pointsPerBooking;
  await vendor.save();

  await WalletTransaction.create({
    vendor: vendorId,
    type: 'POINTS_DEDUCT',
    points: -config.pointsPerBooking,
    pointsAfter: vendor.pointBalance,
    balanceAfter: vendor.walletBalance,
    booking: booking._id,
    description: `Points deducted for ${tenant} booking acceptance (${config.pointsPerBooking})`,
    metadata: { tenantType: tenant },
  });

  if (vendor.pointBalance <= config.lowPointThreshold) {
    await createNotification({
      userId: vendorId,
      title: 'Points running low',
      message: `Your point balance is ${vendor.pointBalance}. Recharge now to keep accepting bookings.`,
      type: 'SYSTEM',
      link: '/dashboard/vendor/subscription',
    });
  }

  return { ok: true, pointsAfter: vendor.pointBalance, pointsDeducted: config.pointsPerBooking };
}

export async function createPointsRechargeOrder(vendorId, amountInRupees, tenantType) {
  const tenant = String(tenantType || serviceTenantForRole((await User.findById(vendorId))?.role) || '').toUpperCase();
  if (!SERVICE_TENANTS.includes(tenant)) throw new Error('Invalid service tenant');

  const amount = Number(amountInRupees);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid recharge amount');

  const config = await getServiceMonetizationConfig(tenant);
  const rate = config.rupeesPerPoint || 1;
  const points = Math.floor(amount / rate);
  if (points <= 0) throw new Error('Amount too low for points conversion');

  const order = await createOrder(amount, `PTS-${tenant}-${String(vendorId).slice(-6)}`, {
    vendorId: String(vendorId),
    tenantType: tenant,
    purpose: 'SERVICE_POINTS_RECHARGE',
    points,
  });

  return {
    tenantType: tenant,
    amount,
    points,
    rupeesPerPoint: rate,
    order,
    keyId: process.env.RAZORPAY_KEY_ID || 'mock_key',
  };
}

export async function confirmPointsRecharge(vendorId, tenantType, paymentData, amountInRupees) {
  const tenant = String(tenantType || '').toUpperCase();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData || {};
  const valid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) throw new Error('Invalid payment signature');

  const config = await getServiceMonetizationConfig(tenant);
  const amount = Number(amountInRupees);
  const points = Math.floor(amount / (config.rupeesPerPoint || 1));
  const vendor = await User.findById(vendorId);
  if (!vendor) throw new Error('Vendor not found');

  vendor.pointBalance = (vendor.pointBalance || 0) + points;
  await vendor.save();

  await WalletTransaction.create({
    vendor: vendorId,
    type: 'POINTS_PURCHASE',
    points,
    amount,
    pointsAfter: vendor.pointBalance,
    balanceAfter: vendor.walletBalance,
    description: `Purchased ${points} points (${tenant})`,
    metadata: { tenantType: tenant, paymentRef: razorpayPaymentId || razorpayOrderId },
  });

  await createNotification({
    userId: vendorId,
    title: 'Points recharged',
    message: `${points} points added to your balance.`,
    type: 'SYSTEM',
    link: '/dashboard/vendor/subscription',
  });

  return { pointBalance: vendor.pointBalance, pointsAdded: points };
}

export async function createUnlimitedMonthlyOrder(vendorId, tenantType) {
  const tenant = String(tenantType || serviceTenantForRole((await User.findById(vendorId))?.role) || '').toUpperCase();
  if (!SERVICE_TENANTS.includes(tenant)) throw new Error('Invalid service tenant');

  const config = await getServiceMonetizationConfig(tenant);
  const amount = Number(config.unlimitedMonthlyPrice) || 0;
  if (amount <= 0) throw new Error('Unlimited plan price not configured');

  const order = await createOrder(amount, `UNL-${tenant}-${String(vendorId).slice(-6)}`, {
    vendorId: String(vendorId),
    tenantType: tenant,
    purpose: 'SERVICE_UNLIMITED_MONTHLY',
  });

  return { tenantType: tenant, amount, order, keyId: process.env.RAZORPAY_KEY_ID || 'mock_key' };
}

export async function activateUnlimitedMonthly(vendorId, tenantType, { paymentRef, amountPaid } = {}) {
  const tenant = String(tenantType || '').toUpperCase();
  const config = await getServiceMonetizationConfig(tenant);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  await VendorSubscription.updateMany(
    { vendor: vendorId, tenantType: tenant, status: 'ACTIVE', unlimitedBookings: true },
    { status: 'EXPIRED' }
  );

  const sub = await VendorSubscription.create({
    vendor: vendorId,
    tenantType: tenant,
    unlimitedBookings: true,
    status: 'ACTIVE',
    startDate: now,
    endDate,
    amountPaid: amountPaid ?? config.unlimitedMonthlyPrice,
    paymentRef,
  });

  await createNotification({
    userId: vendorId,
    title: 'Unlimited bookings activated',
    message: `Unlimited ${tenant} bookings are active until ${endDate.toLocaleDateString('en-IN')}.`,
    type: 'SYSTEM',
    link: '/dashboard/vendor/subscription',
  });

  return sub;
}

export async function confirmUnlimitedMonthly(vendorId, tenantType, paymentData) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData || {};
  const valid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) throw new Error('Invalid payment signature');

  const config = await getServiceMonetizationConfig(tenantType);
  return activateUnlimitedMonthly(vendorId, tenantType, {
    paymentRef: razorpayPaymentId || razorpayOrderId,
    amountPaid: config.unlimitedMonthlyPrice,
  });
}

export async function expireServiceUnlimitedSubscriptions() {
  const now = new Date();
  const expiring = await VendorSubscription.find({
    unlimitedBookings: true,
    status: 'ACTIVE',
    endDate: { $lte: now },
  });

  for (const sub of expiring) {
    sub.status = 'EXPIRED';
    await sub.save();
    await createNotification({
      userId: sub.vendor,
      title: 'Unlimited subscription expired',
      message: `Your unlimited ${sub.tenantType} booking plan has expired. Recharge points or renew unlimited to accept bookings.`,
      type: 'SYSTEM',
      link: '/dashboard/vendor/subscription',
    });
  }

  const configs = await getAllServiceMonetizationConfig();
  for (const tenant of SERVICE_TENANTS) {
    const warnDays = configs[tenant]?.unlimitedWarningDays || 7;
    const threshold = new Date(now.getTime() + warnDays * DAY_MS);
    const soon = await VendorSubscription.find({
      tenantType: tenant,
      unlimitedBookings: true,
      status: 'ACTIVE',
      endDate: { $gt: now, $lte: threshold },
      unlimitedWarningSentAt: { $exists: false },
    });
    for (const sub of soon) {
      const daysLeft = Math.max(1, Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / DAY_MS));
      await createNotification({
        userId: sub.vendor,
        title: 'Unlimited plan ending soon',
        message: `Your unlimited ${tenant} plan ends in ${daysLeft} day(s). Renew to keep accepting bookings without point deductions.`,
        type: 'SYSTEM',
        link: '/dashboard/vendor/subscription',
      });
      sub.unlimitedWarningSentAt = now;
      await sub.save();
    }
  }
}
