/** Client guide customer form — SM_Enterprises_Tour_Breakdown_Complete_Bilingual_v3.pdf */

export const GUIDE_BIKE_ADDON = 200;

export const GUIDE_PACKAGES = [
  {
    id: '4HR',
    guideOnly: 900,
    withBike: 1100,
    nameKey: 'guideGuestBooking.packages.fourHour.name',
    durationKey: 'guideGuestBooking.packages.fourHour.duration',
  },
  {
    id: '8HR',
    guideOnly: 1500,
    withBike: 1700,
    nameKey: 'guideGuestBooking.packages.eightHour.name',
    durationKey: 'guideGuestBooking.packages.eightHour.duration',
  },
];

/** Full sightseeing breakdown shown in the customer rate chart. */
export const GUIDE_TOUR_BREAKDOWN = [
  {
    id: 'mahabaleshwar_1',
    nameKey: 'guideGuestBooking.tours.mahabaleshwar1.name',
    fourHourSpotsKey: 'guideGuestBooking.tours.mahabaleshwar1.fourHourSpots',
    eightHourSpotsKey: 'guideGuestBooking.tours.mahabaleshwar1.eightHourSpots',
  },
  {
    id: 'mahabaleshwar_2',
    nameKey: 'guideGuestBooking.tours.mahabaleshwar2.name',
    fourHourSpotsKey: 'guideGuestBooking.tours.mahabaleshwar2.fourHourSpots',
    eightHourSpotsKey: 'guideGuestBooking.tours.mahabaleshwar2.eightHourSpots',
  },
  {
    id: 'pratapgad',
    nameKey: 'guideGuestBooking.tours.pratapgad.name',
    fourHourSpotsKey: 'guideGuestBooking.tours.pratapgad.fourHourSpots',
    eightHourSpotsKey: 'guideGuestBooking.tours.pratapgad.eightHourSpots',
    noteKey: 'guideGuestBooking.tours.pratapgad.note',
  },
  {
    id: 'panchgani',
    nameKey: 'guideGuestBooking.tours.panchgani.name',
    fourHourSpotsKey: 'guideGuestBooking.tours.panchgani.fourHourSpots',
    eightHourSpotsKey: 'guideGuestBooking.tours.panchgani.eightHourSpots',
    noteKey: 'guideGuestBooking.tours.panchgani.note',
  },
  {
    id: 'panchgani_wai',
    nameKey: 'guideGuestBooking.tours.panchganiWai.name',
    halfDayLabelKey: 'guideGuestBooking.chartSixHourPackage',
    fourHourSpotsKey: 'guideGuestBooking.tours.panchganiWai.fourHourSpots',
    eightHourSpotsKey: 'guideGuestBooking.tours.panchganiWai.eightHourSpots',
  },
  {
    id: 'tapola',
    nameKey: 'guideGuestBooking.tours.tapola.name',
    fourHourSpotsKey: 'guideGuestBooking.tours.tapola.fourHourSpots',
    eightHourSpotsKey: 'guideGuestBooking.tours.tapola.eightHourSpots',
  },
];

export const GUIDE_TOUR_LOCATIONS = GUIDE_TOUR_BREAKDOWN.map(({ id, nameKey }) => ({ id, nameKey }));

export const DEFAULT_GUIDE_PACKAGE_ID = '4HR';
export const DEFAULT_GUIDE_TOUR_ID = GUIDE_TOUR_LOCATIONS[0].id;

export function normalizeGuidePackageId(packageId) {
  const id = String(packageId || '').toUpperCase();
  if (id === '8HR' || id === '12HR') return '8HR';
  return '4HR';
}

export function guidePackageById(packageId) {
  return GUIDE_PACKAGES.find((p) => p.id === normalizeGuidePackageId(packageId)) || GUIDE_PACKAGES[0];
}

export function guideOpenPrice(packageId, bikeAddon = false) {
  const pkg = guidePackageById(packageId);
  return bikeAddon ? pkg.withBike : pkg.guideOnly;
}
