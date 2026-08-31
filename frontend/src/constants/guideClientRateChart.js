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

export const GUIDE_TOUR_LOCATIONS = [
  { id: 'mahabaleshwar_1', nameKey: 'guideGuestBooking.tours.mahabaleshwar1.name' },
  { id: 'mahabaleshwar_2', nameKey: 'guideGuestBooking.tours.mahabaleshwar2.name' },
  { id: 'pratapgad', nameKey: 'guideGuestBooking.tours.pratapgad.name' },
  { id: 'panchgani', nameKey: 'guideGuestBooking.tours.panchgani.name' },
  { id: 'panchgani_wai', nameKey: 'guideGuestBooking.tours.panchganiWai.name' },
  { id: 'tapola', nameKey: 'guideGuestBooking.tours.tapola.name' },
];

export const DEFAULT_GUIDE_PACKAGE_ID = '4HR';

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
