/** Client taxi customer form rate chart — SM_Enterprises_Taxi_Rate_Chart_Booking_Form-v3.pdf */

export const TAXI_LOCAL_TOURS = [
  { id: 'tour_mahabaleshwar_1', price: 1200, nameKey: 'taxiGuestBooking.tours.mahabaleshwar1.name', durationKey: 'taxiGuestBooking.tours.mahabaleshwar1.duration' },
  { id: 'tour_mahabaleshwar_2', price: 1200, nameKey: 'taxiGuestBooking.tours.mahabaleshwar2.name', durationKey: 'taxiGuestBooking.tours.mahabaleshwar2.duration' },
  { id: 'tour_pratapgad', price: 1600, nameKey: 'taxiGuestBooking.tours.pratapgad.name', durationKey: 'taxiGuestBooking.tours.pratapgad.duration' },
  { id: 'tour_panchgani', price: 1200, nameKey: 'taxiGuestBooking.tours.panchgani.name', durationKey: 'taxiGuestBooking.tours.panchgani.duration' },
  { id: 'tour_panchgani_wai', price: 2500, nameKey: 'taxiGuestBooking.tours.panchganiWai.name', durationKey: 'taxiGuestBooking.tours.panchganiWai.duration' },
  { id: 'tour_tapola', price: 1450, nameKey: 'taxiGuestBooking.tours.tapola.name', durationKey: 'taxiGuestBooking.tours.tapola.duration' },
];

export const TAXI_OUTSTATION_ROUTES = [
  { id: 'local_5km_drop', price: 400, nameKey: 'taxiGuestBooking.routes.local5kmDrop.name' },
  { id: 'local_5km_return', price: 800, nameKey: 'taxiGuestBooking.routes.local5kmReturn.name' },
  { id: 'mapro_drop', price: 600, nameKey: 'taxiGuestBooking.routes.maproDrop.name' },
  { id: 'mapro_return', price: 800, nameKey: 'taxiGuestBooking.routes.maproReturn.name' },
  { id: 'panchgani_wai_drop', price: 800, nameKey: 'taxiGuestBooking.routes.panchganiWaiDrop.name' },
  { id: 'panchgani_wai_return', price: 1200, nameKey: 'taxiGuestBooking.routes.panchganiWaiReturn.name' },
  { id: 'satara_drop', price: 2000, nameKey: 'taxiGuestBooking.routes.sataraDrop.name', tollNote: true },
  { id: 'satara_return', price: 2300, nameKey: 'taxiGuestBooking.routes.sataraReturn.name', tollNote: true },
  { id: 'pune_drop', price: 3400, nameKey: 'taxiGuestBooking.routes.puneDrop.name', tollNote: true },
  { id: 'pune_return', price: 4000, nameKey: 'taxiGuestBooking.routes.puneReturn.name', tollNote: true },
  { id: 'mumbai_drop', price: 16000, nameKey: 'taxiGuestBooking.routes.mumbaiDrop.name', tollNote: true },
  { id: 'mumbai_return', price: 17000, nameKey: 'taxiGuestBooking.routes.mumbaiReturn.name', tollNote: true },
  { id: 'poladpur_drop', price: 2000, nameKey: 'taxiGuestBooking.routes.poladpurDrop.name', tollNote: true },
  { id: 'poladpur_return', price: 2300, nameKey: 'taxiGuestBooking.routes.poladpurReturn.name', tollNote: true },
  { id: 'raigad', price: 3500, nameKey: 'taxiGuestBooking.routes.raigad.name', tollNote: true },
  { id: 'khed_drop', price: 3000, nameKey: 'taxiGuestBooking.routes.khedDrop.name', tollNote: true },
  { id: 'khed_return', price: 3500, nameKey: 'taxiGuestBooking.routes.khedReturn.name', tollNote: true },
  { id: 'alibag', price: 15000, nameKey: 'taxiGuestBooking.routes.alibag.name', tollNote: true },
  { id: 'murud', price: 17500, nameKey: 'taxiGuestBooking.routes.murud.name', tollNote: true },
  { id: 'ganpatipule', price: 16000, nameKey: 'taxiGuestBooking.routes.ganpatipule.name', tollNote: true },
];

export const TAXI_CLIENT_ROUTES = [...TAXI_LOCAL_TOURS, ...TAXI_OUTSTATION_ROUTES];

export const DEFAULT_TAXI_ROUTE_ID = TAXI_LOCAL_TOURS[0].id;

export function taxiRouteById(routeId) {
  return TAXI_CLIENT_ROUTES.find((r) => r.id === routeId) || TAXI_LOCAL_TOURS[0];
}

export function taxiRoutePrice(routeId) {
  return taxiRouteById(routeId).price;
}
