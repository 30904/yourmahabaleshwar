/** Client driver customer form — keep in sync with frontend driverClientRateChart.js */

export const DRIVER_PACKAGES = [
  { id: 'local_4hr', price: 700 },
  { id: 'local_8hr', price: 1200 },
  { id: 'outstation_12hr', price: 1600 },
];

export function driverPackageById(packageId) {
  return DRIVER_PACKAGES.find((p) => p.id === packageId) || DRIVER_PACKAGES[0];
}

export function driverPackagePrice(packageId) {
  return driverPackageById(packageId).price;
}
