/** Client taxi customer form rate chart — keep in sync with frontend taxiClientRateChart.js */

export const TAXI_LOCAL_TOURS = [
  { id: 'tour_mahabaleshwar_1', price: 1200 },
  { id: 'tour_mahabaleshwar_2', price: 1200 },
  { id: 'tour_pratapgad', price: 1600 },
  { id: 'tour_panchgani', price: 1200 },
  { id: 'tour_panchgani_wai', price: 2500 },
  { id: 'tour_tapola', price: 1450 },
];

export const TAXI_OUTSTATION_ROUTES = [
  { id: 'local_5km_drop', price: 400 },
  { id: 'local_5km_return', price: 800 },
  { id: 'mapro_drop', price: 600 },
  { id: 'mapro_return', price: 800 },
  { id: 'panchgani_wai_drop', price: 800 },
  { id: 'panchgani_wai_return', price: 1200 },
  { id: 'satara_drop', price: 2000 },
  { id: 'satara_return', price: 2300 },
  { id: 'pune_drop', price: 3400 },
  { id: 'pune_return', price: 4000 },
  { id: 'mumbai_drop', price: 16000 },
  { id: 'mumbai_return', price: 17000 },
  { id: 'poladpur_drop', price: 2000 },
  { id: 'poladpur_return', price: 2300 },
  { id: 'raigad', price: 3500 },
  { id: 'khed_drop', price: 3000 },
  { id: 'khed_return', price: 3500 },
  { id: 'alibag', price: 15000 },
  { id: 'murud', price: 17500 },
  { id: 'ganpatipule', price: 16000 },
];

export const TAXI_CLIENT_ROUTES = [...TAXI_LOCAL_TOURS, ...TAXI_OUTSTATION_ROUTES];

export const DEFAULT_TAXI_ROUTE_ID = TAXI_LOCAL_TOURS[0].id;

export function taxiRouteById(routeId) {
  return TAXI_CLIENT_ROUTES.find((r) => r.id === routeId) || TAXI_LOCAL_TOURS[0];
}

export function taxiRoutePrice(routeId) {
  return taxiRouteById(routeId).price;
}
