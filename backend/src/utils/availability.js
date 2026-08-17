import Booking from '../models/Booking.js';
import { BOOKING_STATUS } from '../constants/booking.js';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const eachDateInRange = (from, to) => {
  const dates = [];
  const cur = startOfDay(from);
  const end = startOfDay(to);
  while (cur < end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

export const isDateBlocked = (blockedDates = [], date) => {
  const target = startOfDay(date).getTime();
  return (blockedDates || []).some((d) => startOfDay(d).getTime() === target);
};

export const rangeHasBlocked = (blockedDates = [], checkIn, checkOut) => {
  if (!checkOut || startOfDay(checkIn).getTime() === startOfDay(checkOut).getTime()) {
    return isDateBlocked(blockedDates, checkIn);
  }
  return eachDateInRange(checkIn, checkOut).some((d) => isDateBlocked(blockedDates, d));
};

/**
 * Check overlapping active bookings for inventory conflict.
 */
export const hasBookingConflict = async ({
  type,
  listingField,
  listingId,
  checkIn,
  checkOut,
  capacity = 1,
  quantity = 1,
  extraFilter = {},
}) => {
  const ci = startOfDay(checkIn);
  const co = checkOut ? startOfDay(checkOut) : endOfDay(checkIn);

  const filter = {
    type,
    [listingField]: listingId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    ...extraFilter,
  };

  if (checkOut) {
    filter.checkIn = { $lt: co };
    filter.$or = [{ checkOut: { $gt: ci } }, { checkOut: null }];
  } else {
    filter.checkIn = { $gte: ci, $lte: endOfDay(checkIn) };
  }

  const existing = await Booking.find(filter);
  if (!existing.length) return false;

  if (type === 'TENT') {
    const bookedQty = existing.reduce((sum, b) => sum + (b.tentQuantity || 1), 0);
    return bookedQty + quantity > capacity;
  }

  if (type === 'HOTEL' || type === 'HOMESTAY' || type === 'RESORT') {
    return existing.length + quantity > capacity;
  }

  // guide/taxi/horse — one booking per slot/day by default
  return existing.length >= capacity;
};

export const getUnavailableDates = async ({
  type,
  listingField,
  listingId,
  from,
  to,
  blockedDates = [],
  capacity = 1,
}) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const unavailable = new Set(
    (blockedDates || []).map((d) => startOfDay(d).toISOString().slice(0, 10))
  );

  const bookings = await Booking.find({
    type,
    [listingField]: listingId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    checkIn: { $lt: end },
    $or: [{ checkOut: { $gt: start } }, { checkOut: null, checkIn: { $gte: start } }],
  });

  for (const b of bookings) {
    if (b.checkOut) {
      for (const d of eachDateInRange(b.checkIn, b.checkOut)) {
        const key = startOfDay(d).toISOString().slice(0, 10);
        // simplify: mark date unavailable when capacity is 1 or fully booked
        if (capacity <= 1) unavailable.add(key);
      }
    } else if (b.checkIn) {
      unavailable.add(startOfDay(b.checkIn).toISOString().slice(0, 10));
    }
  }

  return [...unavailable].sort();
};
