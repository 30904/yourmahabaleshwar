/** Booking entry source labels for admin / lists */
export const BOOKING_SOURCE = {
  WEBSITE: 'WEBSITE',
  CALL: 'CALL',
  WALK_IN: 'WALK_IN',
};

export function bookingSourceMeta(source) {
  const key = String(source || BOOKING_SOURCE.WEBSITE).toUpperCase();
  if (key === BOOKING_SOURCE.CALL) {
    return { key, label: 'Call booking', className: 'text-blue-600' };
  }
  if (key === BOOKING_SOURCE.WALK_IN) {
    return { key, label: 'Walk in', className: 'text-emerald-600' };
  }
  return { key: BOOKING_SOURCE.WEBSITE, label: 'Website booking', className: 'text-red-600' };
}
