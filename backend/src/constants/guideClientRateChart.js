/** Client guide customer form — keep in sync with frontend guideClientRateChart.js */

export const GUIDE_BIKE_ADDON = 200;

export const GUIDE_PACKAGES = [
  { id: '4HR', guideOnly: 900, withBike: 1100 },
  { id: '8HR', guideOnly: 1500, withBike: 1700 },
];

export function normalizeGuidePackageId(packageId) {
  const id = String(packageId || '').toUpperCase();
  if (id === '8HR' || id === '12HR') return '8HR';
  return '4HR';
}

export function guideOpenPrice(packageId, bikeAddon = false) {
  const id = normalizeGuidePackageId(packageId);
  const pkg = GUIDE_PACKAGES.find((p) => p.id === id) || GUIDE_PACKAGES[0];
  return bikeAddon ? pkg.withBike : pkg.guideOnly;
}
