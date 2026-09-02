/** Default indicative fares for open service bookings — keep in sync with backend serviceMonetization.js */
export const OPEN_SERVICE_RATES = {
  GUIDE: {
    package6hr: 900,
    package12hr: 1500,
    bikeAddon: 200,
  },
  TAXI: {
    defaultPerTripPrice: 1200,
    defaultHourlyRate: 400,
  },
  DRIVER: {
    defaultPerTripPrice: 1200,
    defaultHourlyRate: 350,
  },
  TENT: {
    defaultPricePerNight: 2000,
  },
  HORSE: {
    defaultRidePrice: 800,
    routes: [
      { id: 'sightseeing', nameKey: 'horseGuestBooking.packages.sightseeing.name', price: 800 },
      { id: 'point_to_point', nameKey: 'horseGuestBooking.packages.pointToPoint.name', price: 500 },
      { id: 'jungle_trail', nameKey: 'horseGuestBooking.packages.jungleTrail.name', price: 1200 },
      { id: 'sunset_sunrise', nameKey: 'horseGuestBooking.packages.sunsetSunrise.name', price: 1000 },
      { id: 'kids', nameKey: 'horseGuestBooking.packages.kids.name', price: 400 },
    ],
  },
};

export function openRatesForTenant(tenant) {
  return OPEN_SERVICE_RATES[String(tenant || '').toUpperCase()] || OPEN_SERVICE_RATES.TAXI;
}
