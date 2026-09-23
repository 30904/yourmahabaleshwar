/** Minutes since midnight for "HH:mm". */
export function timeToMinutes(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute) || hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return hour24 * 60 + minute;
}

/** Clamp guest time into [minTime, maxTime] as "HH:mm". */
export function clampTime24(value, minTime, maxTime) {
  const mins = timeToMinutes(value);
  if (mins == null) return minTime || maxTime || '00:00';
  const minM = timeToMinutes(minTime);
  const maxM = timeToMinutes(maxTime);
  let next = mins;
  if (minM != null && next < minM) next = minM;
  if (maxM != null && next > maxM) next = maxM;
  const hour24 = Math.floor(next / 60);
  const minute = next % 60;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Stay check-in: not earlier than listing; check-out: not later than listing. */
export function resolveStayBookingTimes({ guestCheckInTime, guestCheckOutTime, listingCheckInTime, listingCheckOutTime }) {
  const checkInMin = listingCheckInTime || '14:00';
  const checkOutMax = listingCheckOutTime || '11:00';
  return {
    checkInTime: clampTime24(guestCheckInTime || checkInMin, checkInMin, '23:59'),
    checkOutTime: clampTime24(guestCheckOutTime || checkOutMax, '00:00', checkOutMax),
  };
}
