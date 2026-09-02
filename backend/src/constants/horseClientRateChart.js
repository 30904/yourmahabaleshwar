/** Client horse customer form — keep in sync with frontend horseClientRateChart.js */

export const HORSE_CLIENT_PACKAGES = [
  { id: 'sightseeing', price: 800 },
  { id: 'point_to_point', price: 500 },
  { id: 'jungle_trail', price: 1200 },
  { id: 'sunset_sunrise', price: 1000 },
  { id: 'kids', price: 400 },
];

export function horsePackageById(packageId) {
  return HORSE_CLIENT_PACKAGES.find((p) => p.id === packageId) || HORSE_CLIENT_PACKAGES[0];
}

export function horsePackagePrice(packageId) {
  return horsePackageById(packageId).price;
}
