import Booking from '../models/Booking.js';
import { BOOKING_STATUS, BOOKING_TYPES } from '../constants/booking.js';

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

const unitsForBooking = (booking, type) => {
  if (type === BOOKING_TYPES.TENT || type === 'TENT') return Number(booking.tentQuantity) || 1;
  return 1;
};

/** True if booking occupies the night starting on `night` (check-in night semantics). */
export const bookingCoversNight = (booking, night) => {
  const nightStart = startOfDay(night).getTime();
  if (!booking?.checkIn) return false;
  const ci = startOfDay(booking.checkIn).getTime();
  if (booking.checkOut) {
    const co = startOfDay(booking.checkOut).getTime();
    return nightStart >= ci && nightStart < co;
  }
  return nightStart === ci;
};

/** Peak units booked on any night in [checkIn, checkOut). */
export const peakOccupancyForRange = (bookings, checkIn, checkOut, type) => {
  const ci = startOfDay(checkIn);
  const co = checkOut ? startOfDay(checkOut) : new Date(ci.getTime() + 86400000);
  const nights = eachDateInRange(ci, co);
  if (!nights.length) {
    const count = (bookings || []).reduce(
      (sum, b) => sum + (bookingCoversNight(b, ci) ? unitsForBooking(b, type) : 0),
      0
    );
    return count;
  }
  let peak = 0;
  for (const night of nights) {
    let used = 0;
    for (const booking of bookings || []) {
      if (bookingCoversNight(booking, night)) used += unitsForBooking(booking, type);
    }
    if (used > peak) peak = used;
  }
  return peak;
};

const resolveTypeFilter = (type, listingField) => {
  if (listingField === 'room' && (type === BOOKING_TYPES.HOTEL || type === BOOKING_TYPES.RESORT || type === 'HOTEL' || type === 'RESORT')) {
    return { $in: [BOOKING_TYPES.HOTEL, BOOKING_TYPES.RESORT] };
  }
  return type;
};

/**
 * Check overlapping active bookings for inventory conflict (per-night capacity).
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
    type: resolveTypeFilter(type, listingField),
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

  if (
    type === BOOKING_TYPES.TENT ||
    type === 'TENT' ||
    type === BOOKING_TYPES.HOTEL ||
    type === 'HOTEL' ||
    type === BOOKING_TYPES.HOMESTAY ||
    type === 'HOMESTAY' ||
    type === BOOKING_TYPES.RESORT ||
    type === 'RESORT'
  ) {
    const peak = peakOccupancyForRange(existing, checkIn, checkOut || new Date(ci.getTime() + 86400000), type);
    return peak + quantity > capacity;
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
  extraFilter = {},
}) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const unavailable = new Set((blockedDates || []).map((d) => toDateKey(d)));

  const bookings = await Booking.find({
    type: resolveTypeFilter(type, listingField),
    [listingField]: listingId,
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
    checkIn: { $lt: end },
    $or: [{ checkOut: { $gt: start } }, { checkOut: null, checkIn: { $gte: start } }],
    ...extraFilter,
  });

  const occupancy = new Map();
  for (const booking of bookings) {
    const nights = booking.checkOut
      ? eachDateInRange(booking.checkIn, booking.checkOut)
      : booking.checkIn
        ? [startOfDay(booking.checkIn)]
        : [];
    const units = unitsForBooking(booking, type);
    for (const night of nights) {
      const t = startOfDay(night).getTime();
      if (t < start.getTime() || t >= end.getTime()) continue;
      const key = toDateKey(night);
      occupancy.set(key, (occupancy.get(key) || 0) + units);
    }
  }

  for (const [key, used] of occupancy.entries()) {
    if (used >= capacity) unavailable.add(key);
  }

  return [...unavailable].sort();
};
