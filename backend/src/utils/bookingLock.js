import crypto from 'crypto';
import { env } from '../config/env.js';
import { ensureRedis } from '../config/redis.js';
import { eachDateInRange, toDateKey } from './availability.js';

const LOCK_PREFIX = 'ymb:lock:book';
const DEFAULT_TTL_MS = 25000;
const ACQUIRE_WAIT_MS = 8000;
const RETRY_MS = 80;

/** In-process mutex map used when Redis is unavailable (single Node instance only). */
const localLocks = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const unlockScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export class BookingLockError extends Error {
  constructor(message = 'Another booking is in progress for these dates. Please try again.') {
    super(message);
    this.name = 'BookingLockError';
    this.code = 'BOOKING_LOCK_BUSY';
    this.statusCode = 409;
  }
}

export class BookingLockUnavailableError extends Error {
  constructor(message = 'Booking system temporarily unavailable. Please try again in a moment.') {
    super(message);
    this.name = 'BookingLockUnavailableError';
    this.code = 'BOOKING_LOCK_UNAVAILABLE';
    this.statusCode = 503;
  }
}

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const nextDay = (d) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
};

/** Night keys for stay-style ranges [checkIn, checkOut). */
export const stayDateKeys = (checkIn, checkOut) => {
  const ci = startOfDay(checkIn);
  const co = checkOut ? startOfDay(checkOut) : nextDay(ci);
  if (!(co > ci)) return [toDateKey(ci)];
  return eachDateInRange(ci, co).map((d) => toDateKey(d));
};

export const buildStayLockKeys = (resource, listingId, checkIn, checkOut) => {
  const id = String(listingId || '').trim();
  if (!id) return [];
  return stayDateKeys(checkIn, checkOut).map((day) => `${LOCK_PREFIX}:${resource}:${id}:${day}`);
};

export const buildDayLockKey = (resource, listingId, date) => {
  const id = String(listingId || '').trim();
  if (!id || !date) return null;
  return `${LOCK_PREFIX}:${resource}:${id}:${toDateKey(date)}`;
};

export const hotelRoomLockKeys = (roomId, checkIn, checkOut) =>
  buildStayLockKeys('room', roomId, checkIn, checkOut);

export const tentLockKeys = (tentId, checkIn, checkOut) =>
  buildStayLockKeys('tent', tentId, checkIn, checkOut);

export const homestayRoomLockKeys = (homestayId, roomId, checkIn, checkOut) => {
  const hid = String(homestayId || '').trim();
  const rid = String(roomId || '').trim();
  if (!hid || !rid) return [];
  return stayDateKeys(checkIn, checkOut).map(
    (day) => `${LOCK_PREFIX}:homestay:${hid}:room:${rid}:${day}`
  );
};

export const guideDayLockKeys = (guideId, date) => {
  const key = buildDayLockKey('guide', guideId, date);
  return key ? [key] : [];
};

/** Taxi and driver share Booking.driver — one lock namespace. */
export const driverDayLockKeys = (driverId, date) => {
  const key = buildDayLockKey('driver', driverId, date);
  return key ? [key] : [];
};

export const horseDayLockKeys = (horseId, date) => {
  const key = buildDayLockKey('horse', horseId, date);
  return key ? [key] : [];
};

async function acquireLocal(key, ttlMs, waitMs) {
  const started = Date.now();
  while (Date.now() - started < waitMs) {
    const existing = localLocks.get(key);
    if (!existing || existing.expiresAt <= Date.now()) {
      const token = crypto.randomBytes(16).toString('hex');
      localLocks.set(key, { token, expiresAt: Date.now() + ttlMs });
      return token;
    }
    await sleep(RETRY_MS);
  }
  return null;
}

async function releaseLocal(key, token) {
  const existing = localLocks.get(key);
  if (existing && existing.token === token) localLocks.delete(key);
}

async function acquireRedis(redis, key, token, ttlMs, waitMs) {
  const started = Date.now();
  while (Date.now() - started < waitMs) {
    const ok = await redis.set(key, token, 'PX', ttlMs, 'NX');
    if (ok === 'OK') return true;
    await sleep(RETRY_MS);
  }
  return false;
}

async function releaseRedis(redis, key, token) {
  try {
    await redis.eval(unlockScript, 1, key, token);
  } catch {
    /* ignore */
  }
}

/**
 * Acquire exclusive locks for inventory keys (sorted to avoid deadlock).
 * Uses Redis when REDIS_URL is set; otherwise in-process mutex (dev / single instance).
 */
export async function acquireBookingLocks(keys, { ttlMs = DEFAULT_TTL_MS, waitMs = ACQUIRE_WAIT_MS } = {}) {
  const unique = [...new Set((keys || []).filter(Boolean))].sort();
  if (!unique.length) return { keys: [], tokens: {}, mode: 'none' };

  let mode = 'local';
  let redis = null;

  if (env.redisUrl) {
    redis = await ensureRedis();
    if (!redis) {
      throw new BookingLockUnavailableError();
    }
    mode = 'redis';
  }

  const tokens = {};
  const held = [];

  try {
    for (const key of unique) {
      const token = crypto.randomBytes(16).toString('hex');
      let acquired = false;
      if (mode === 'redis') {
        acquired = await acquireRedis(redis, key, token, ttlMs, waitMs);
        if (acquired) tokens[key] = token;
      } else {
        const localToken = await acquireLocal(key, ttlMs, waitMs);
        if (localToken) {
          tokens[key] = localToken;
          acquired = true;
        }
      }
      if (!acquired) throw new BookingLockError();
      held.push(key);
    }
    return { keys: unique, tokens, mode };
  } catch (err) {
    await releaseBookingLocks({ keys: held, tokens, mode });
    throw err;
  }
}

export async function releaseBookingLocks(lockHandle) {
  if (!lockHandle?.keys?.length) return;
  const { keys, tokens = {}, mode } = lockHandle;
  const redis = mode === 'redis' ? await ensureRedis() : null;
  for (const key of [...keys].reverse()) {
    const token = tokens[key];
    if (!token) continue;
    if (mode === 'redis' && redis) await releaseRedis(redis, key, token);
    else await releaseLocal(key, token);
  }
}

/** Run fn while holding inventory locks. Always releases locks. */
export async function withBookingLocks(keys, fn, options) {
  const handle = await acquireBookingLocks(keys, options);
  try {
    return await fn(handle);
  } finally {
    await releaseBookingLocks(handle);
  }
}

export const isBookingLockError = (err) =>
  err?.code === 'BOOKING_LOCK_BUSY' || err?.code === 'BOOKING_LOCK_UNAVAILABLE';

export const respondBookingLockError = (res, err, errorFn) => {
  if (err?.code === 'BOOKING_LOCK_BUSY' || err?.code === 'BOOKING_LOCK_UNAVAILABLE') {
    errorFn(res, err.message, err.statusCode || 409);
    return true;
  }
  return false;
};
