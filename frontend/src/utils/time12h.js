/** Parse "HH:mm" (24h) into { hour12, minute, period }. */
export function parseTime24(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return { hour12: 12, minute: 0, period: 'AM' };
  }
  let hour24 = Number(match[1]);
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) {
    hour24 = 9;
  }
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
}

/** Build "HH:mm" (24h) from 12h parts. */
export function toTime24(hour12, minute, period) {
  let h = Number(hour12);
  const m = Math.min(59, Math.max(0, Number(minute) || 0));
  if (!Number.isFinite(h) || h < 1 || h > 12) h = 12;
  const isPm = String(period).toUpperCase() === 'PM';
  let hour24 = h % 12;
  if (isPm) hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

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

/** Clamp "HH:mm" into [minTime, maxTime]. */
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

export function isTimeInRange(value, minTime, maxTime) {
  const mins = timeToMinutes(value);
  if (mins == null) return false;
  const minM = timeToMinutes(minTime);
  const maxM = timeToMinutes(maxTime);
  if (minM != null && mins < minM) return false;
  if (maxM != null && mins > maxM) return false;
  return true;
}

/** Format "HH:mm" for display as "3:00 PM". */
export function formatTime12(value) {
  const { hour12, minute, period } = parseTime24(value);
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}
