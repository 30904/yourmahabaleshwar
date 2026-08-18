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

const pad2 = (n) => String(n).padStart(2, '0');

/** Local calendar YYYY-MM-DD (avoids UTC shifting midnight in IST). */
export const toDateKey = (d) => {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
};

export const availabilityWindow = (fromQuery, toQuery, days = 90) => {
  const from = startOfDay(fromQuery || new Date());
  const to = toQuery
    ? startOfDay(toQuery)
    : (() => {
        const d = new Date(from);
        d.setDate(d.getDate() + days);
        return d;
      })();
  return { from, to };
};

const dateKeys = (arr = []) =>
  [
    ...new Set(
      (arr || [])
        .map((d) => {
          const x = new Date(d);
          return Number.isNaN(x.getTime()) ? null : toDateKey(x);
        })
        .filter(Boolean)
    ),
  ].sort();

export const applyBlockedDateAction = (existing = [], incoming = [], action = 'set') => {
  const toDates = (keys) => keys.map((key) => startOfDay(key));
  if (action === 'add') {
    return toDates([...new Set([...dateKeys(existing), ...dateKeys(incoming)])].sort());
  }
  if (action === 'remove') {
    const remove = new Set(dateKeys(incoming));
    return toDates(dateKeys(existing).filter((key) => !remove.has(key)));
  }
  return toDates(dateKeys(incoming));
};

export const normalizeBlockedDates = (blockedDates = [], from, to) => {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  return [
    ...new Set(
      (blockedDates || [])
        .map((d) => startOfDay(d))
        .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= start && d.getTime() < end)
        .map((d) => toDateKey(d))
    ),
  ].sort();
};

export const getBookedDates = async ({ type, listingField, listingId, from, to }) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const bookings = await Booking.find({
    type,
    [listingField]: listingId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    checkIn: { $lt: end },
    $or: [{ checkOut: { $gt: start } }, { checkOut: null, checkIn: { $gte: start } }],
  }).select('checkIn checkOut');

  const booked = new Set();
  for (const booking of bookings) {
    if (booking.checkOut) {
      for (const d of eachDateInRange(booking.checkIn, booking.checkOut)) {
        const t = startOfDay(d).getTime();
        if (t >= start.getTime() && t < end.getTime()) booked.add(toDateKey(d));
      }
    } else if (booking.checkIn) {
      const t = startOfDay(booking.checkIn).getTime();
      if (t >= start.getTime() && t < end.getTime()) booked.add(toDateKey(booking.checkIn));
    }
  }
  return [...booked].sort();
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
  const unavailable = new Set((blockedDates || []).map((d) => toDateKey(d)));

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
        const key = toDateKey(d);
        // simplify: mark date unavailable when capacity is 1 or fully booked
        if (capacity <= 1) unavailable.add(key);
      }
    } else if (b.checkIn) {
      unavailable.add(toDateKey(b.checkIn));
    }
  }

  return [...unavailable].sort();
};
