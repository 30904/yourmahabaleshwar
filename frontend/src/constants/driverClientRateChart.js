/** Client driver customer form — SM_Enterprises_Customer_Booking_Form_Bilingual_v7.pdf */

export const DRIVER_PACKAGES = [
  {
    id: 'local_4hr',
    price: 700,
    nameKey: 'driverGuestBooking.packages.local4hr.name',
    detailsKey: 'driverGuestBooking.packages.local4hr.details',
  },
  {
    id: 'local_8hr',
    price: 1200,
    nameKey: 'driverGuestBooking.packages.local8hr.name',
    detailsKey: 'driverGuestBooking.packages.local8hr.details',
  },
  {
    id: 'outstation_12hr',
    price: 1600,
    nameKey: 'driverGuestBooking.packages.outstation12hr.name',
    detailsKey: 'driverGuestBooking.packages.outstation12hr.details',
  },
];

export const DRIVER_EXTRA_CHARGES = [
  { labelKey: 'driverGuestBooking.extraCharges.overtime', amount: 150 },
  { labelKey: 'driverGuestBooking.extraCharges.night', amount: 200 },
  { labelKey: 'driverGuestBooking.extraCharges.oneWayLuxury', amount: 100 },
];

export const DEFAULT_DRIVER_PACKAGE_ID = 'local_4hr';

export function driverPackageById(packageId) {
  return DRIVER_PACKAGES.find((p) => p.id === packageId) || DRIVER_PACKAGES[0];
}

export function driverPackagePrice(packageId) {
  return driverPackageById(packageId).price;
}
