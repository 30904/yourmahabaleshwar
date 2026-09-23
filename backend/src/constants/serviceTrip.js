/** Shared trip lifecycle for GUIDE / TAXI / DRIVER / HORSE */

export const TRIP_SERVICE_TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'HORSE'];
export const TRIP_BOOKING_TYPES = ['GUIDE', 'TAXI', 'HORSE'];

/** Overtime rate for extended package/trip duration (₹/hr). */
export const SERVICE_OVERTIME_PER_HOUR = 150;

export const isTripServiceBooking = (booking) => {
  if (!booking) return false;
  if (booking.serviceTenant && TRIP_SERVICE_TENANTS.includes(booking.serviceTenant)) return true;
  return TRIP_BOOKING_TYPES.includes(booking.type);
};

export const serviceTripLabel = (booking) => {
  const tenant = booking?.serviceTenant || booking?.type;
  if (tenant === 'DRIVER') return 'Driver';
  if (tenant === 'TAXI') return 'Taxi';
  if (tenant === 'HORSE') return 'Horse';
  if (tenant === 'GUIDE') return 'Guide';
  return 'Service';
};

export const adminBookingsLink = (booking) => {
  const tenant = booking?.serviceTenant || booking?.type;
  if (tenant === 'DRIVER') return '/admin/bookings/drivers';
  if (tenant === 'TAXI') return '/admin/bookings/taxi';
  if (tenant === 'HORSE') return '/admin/bookings/horses';
  return '/admin/bookings/guides';
};

export const hasVendorArrived = (booking) =>
  !!(booking?.vendorArrivedAt || booking?.guideReachedConfirmed || booking?.arrivalConfirmed);

export const isArrivalConfirmed = (booking) =>
  !!(booking?.arrivalConfirmed || booking?.guideReachedConfirmed);

export const isServiceEnded = (booking) =>
  !!(booking?.serviceEndedAt || booking?.guideEndedAt || booking?.status === 'COMPLETED');

export const isEndProposed = (booking) => !!(booking?.endProposedAt && !isServiceEnded(booking));
