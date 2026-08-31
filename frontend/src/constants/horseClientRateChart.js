/** Client horse customer form — SM_Enterprises_Horse_Riding_Customer_Booking_Form_Bilingual.pdf */

export const HORSE_CLIENT_PACKAGES = [
  {
    id: 'sightseeing',
    price: 800,
    nameKey: 'horseGuestBooking.packages.sightseeing.name',
    detailsKey: 'horseGuestBooking.packages.sightseeing.details',
  },
  {
    id: 'point_to_point',
    price: 500,
    nameKey: 'horseGuestBooking.packages.pointToPoint.name',
    detailsKey: 'horseGuestBooking.packages.pointToPoint.details',
  },
  {
    id: 'jungle_trail',
    price: 1200,
    nameKey: 'horseGuestBooking.packages.jungleTrail.name',
    detailsKey: 'horseGuestBooking.packages.jungleTrail.details',
  },
  {
    id: 'sunset_sunrise',
    price: 1000,
    nameKey: 'horseGuestBooking.packages.sunsetSunrise.name',
    detailsKey: 'horseGuestBooking.packages.sunsetSunrise.details',
  },
  {
    id: 'kids',
    price: 400,
    nameKey: 'horseGuestBooking.packages.kids.name',
    detailsKey: 'horseGuestBooking.packages.kids.details',
  },
];

export const DEFAULT_HORSE_PACKAGE_ID = 'sightseeing';

export function horsePackageById(packageId) {
  return HORSE_CLIENT_PACKAGES.find((p) => p.id === packageId) || HORSE_CLIENT_PACKAGES[0];
}

export function horsePackagePrice(packageId) {
  return horsePackageById(packageId).price;
}

export function openHorseRoutesForI18n(t) {
  return HORSE_CLIENT_PACKAGES.map((pkg) => ({
    _id: pkg.id,
    name: t(pkg.nameKey),
    price: pkg.price,
    description: t(pkg.detailsKey),
    durationMinutes: null,
  }));
}
