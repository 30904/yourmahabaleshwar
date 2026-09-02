import { ROLES } from './roles.js';
import { BOOKING_TYPES } from './booking.js';

export const SERVICE_TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'TENT', 'HORSE'];

export const ROLE_TO_SERVICE_TENANT = {
  [ROLES.GUIDE]: 'GUIDE',
  [ROLES.TAXI_OPERATOR]: 'TAXI',
  [ROLES.DRIVER]: 'DRIVER',
  [ROLES.TENT_OPERATOR]: 'TENT',
  [ROLES.HORSE_OPERATOR]: 'HORSE',
};

export const BOOKING_TYPE_TO_SERVICE_TENANT = {
  [BOOKING_TYPES.GUIDE]: 'GUIDE',
  [BOOKING_TYPES.TAXI]: 'TAXI',
  [BOOKING_TYPES.TENT]: 'TENT',
  [BOOKING_TYPES.HORSE]: 'HORSE',
};

export const DEFAULT_SERVICE_MONETIZATION = {
  GUIDE: {
    rupeesPerPoint: 1,
    pointsPerBooking: 10,
    unlimitedMonthlyPrice: 2999,
    lowPointThreshold: 20,
    unlimitedWarningDays: 7,
    defaultPackage6hr: 900,
    defaultPackage12hr: 1500,
    defaultBikeAddon: 200,
  },
  TAXI: {
    rupeesPerPoint: 1,
    pointsPerBooking: 8,
    unlimitedMonthlyPrice: 3499,
    lowPointThreshold: 16,
    unlimitedWarningDays: 7,
    defaultPerTripPrice: 1200,
    defaultHourlyRate: 400,
  },
  DRIVER: {
    rupeesPerPoint: 1,
    pointsPerBooking: 8,
    unlimitedMonthlyPrice: 2499,
    lowPointThreshold: 16,
    unlimitedWarningDays: 7,
    defaultPerTripPrice: 1200,
    defaultHourlyRate: 350,
  },
  TENT: {
    rupeesPerPoint: 1,
    pointsPerBooking: 12,
    unlimitedMonthlyPrice: 3999,
    lowPointThreshold: 24,
    unlimitedWarningDays: 7,
    defaultPricePerNight: 2000,
  },
  HORSE: {
    rupeesPerPoint: 1,
    pointsPerBooking: 6,
    unlimitedMonthlyPrice: 1999,
    lowPointThreshold: 12,
    unlimitedWarningDays: 7,
    defaultRidePrice: 800,
  },
};

export function serviceTenantForRole(role) {
  return ROLE_TO_SERVICE_TENANT[role] || null;
}

export function serviceTenantForBooking(booking) {
  if (booking?.serviceTenant) return booking.serviceTenant;
  return BOOKING_TYPE_TO_SERVICE_TENANT[booking?.type] || null;
}

export function isServiceTenantRole(role) {
  return Boolean(serviceTenantForRole(role));
}
