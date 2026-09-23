/** Client taxi customer form rate chart — SM Enterprises taxi rate chart (4-seater Non A/C). */

export const TAXI_CAR_TYPES = [
  { id: 'AC_4_SEATER', labelKey: 'taxiGuestBooking.carTypes.ac4' },
  { id: 'AC_7_SEATER', labelKey: 'taxiGuestBooking.carTypes.ac7' },
  { id: 'NON_AC_4_SEATER', labelKey: 'taxiGuestBooking.carTypes.nonAc4' },
  { id: 'NON_AC_7_SEATER', labelKey: 'taxiGuestBooking.carTypes.nonAc7' },
  { id: 'MINI_TRAVELS_19_SEATER', labelKey: 'taxiGuestBooking.carTypes.miniTravels19' },
];

export const DEFAULT_TAXI_CAR_TYPE = TAXI_CAR_TYPES[0].id;

export function taxiCarTypeById(carTypeId) {
  return TAXI_CAR_TYPES.find((c) => c.id === carTypeId) || TAXI_CAR_TYPES[0];
}

export const TAXI_LOCAL_TOURS = [
  {
    id: 'tour_mahabaleshwar_1',
    price: 1200,
    nameKey: 'taxiGuestBooking.tours.mahabaleshwar1.name',
    durationKey: 'taxiGuestBooking.tours.mahabaleshwar1.duration',
    pointsKey: 'taxiGuestBooking.tours.mahabaleshwar1.points',
  },
  {
    id: 'tour_mahabaleshwar_2',
    price: 1200,
    nameKey: 'taxiGuestBooking.tours.mahabaleshwar2.name',
    durationKey: 'taxiGuestBooking.tours.mahabaleshwar2.duration',
    pointsKey: 'taxiGuestBooking.tours.mahabaleshwar2.points',
  },
  {
    id: 'tour_pratapgad',
    price: 1600,
    nameKey: 'taxiGuestBooking.tours.pratapgad.name',
    durationKey: 'taxiGuestBooking.tours.pratapgad.duration',
    pointsKey: 'taxiGuestBooking.tours.pratapgad.points',
    noteKey: 'taxiGuestBooking.tours.pratapgad.note',
  },
  {
    id: 'tour_panchgani',
    price: 1200,
    nameKey: 'taxiGuestBooking.tours.panchgani.name',
    durationKey: 'taxiGuestBooking.tours.panchgani.duration',
    pointsKey: 'taxiGuestBooking.tours.panchgani.points',
    noteKey: 'taxiGuestBooking.tours.panchgani.note',
  },
  {
    id: 'tour_panchgani_wai',
    price: 2500,
    nameKey: 'taxiGuestBooking.tours.panchganiWai.name',
    durationKey: 'taxiGuestBooking.tours.panchganiWai.duration',
    pointsKey: 'taxiGuestBooking.tours.panchganiWai.points',
  },
  {
    id: 'tour_tapola',
    price: 1450,
    nameKey: 'taxiGuestBooking.tours.tapola.name',
    durationKey: 'taxiGuestBooking.tours.tapola.duration',
    pointsKey: 'taxiGuestBooking.tours.tapola.points',
    noteKey: 'taxiGuestBooking.tours.tapola.note',
  },
];

/** Bookable outstation options (drop / return where applicable). */
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
  { id: 'poladpur_drop', price: 2000, nameKey: 'taxiGuestBooking.routes.poladpurDrop.name', tollNote: true },
  { id: 'poladpur_return', price: 2300, nameKey: 'taxiGuestBooking.routes.poladpurReturn.name', tollNote: true },
  { id: 'raigad', price: 3500, nameKey: 'taxiGuestBooking.routes.raigad.name', tollNote: true },
  { id: 'khed_drop', price: 3000, nameKey: 'taxiGuestBooking.routes.khedDrop.name', tollNote: true },
  { id: 'khed_return', price: 3500, nameKey: 'taxiGuestBooking.routes.khedReturn.name', tollNote: true },
  { id: 'alibag', price: 15000, nameKey: 'taxiGuestBooking.routes.alibag.name', tollNote: true },
  { id: 'matheran', price: 17500, nameKey: 'taxiGuestBooking.routes.matheran.name', tollNote: true },
  { id: 'ganpatipule', price: 16000, nameKey: 'taxiGuestBooking.routes.ganpatipule.name', tollNote: true },
  { id: 'mumbai_drop', price: 16000, nameKey: 'taxiGuestBooking.routes.mumbaiDrop.name', tollNote: true },
  { id: 'mumbai_return', price: 17000, nameKey: 'taxiGuestBooking.routes.mumbaiReturn.name', tollNote: true },
];

/** Rate-chart display rows (matches official drop / return layout). */
export const TAXI_OUTSTATION_CHART_ROWS = [
  {
    id: 'local_5km',
    nameKey: 'taxiGuestBooking.chartRows.local5km',
    drop: 400,
    return: 800,
  },
  {
    id: 'mapro',
    nameKey: 'taxiGuestBooking.chartRows.mapro',
    drop: 600,
    return: 800,
  },
  {
    id: 'panchgani_wai',
    nameKey: 'taxiGuestBooking.chartRows.panchganiWai',
    drop: 800,
    return: 1200,
  },
  {
    id: 'satara',
    nameKey: 'taxiGuestBooking.chartRows.satara',
    drop: 2000,
    return: 2300,
    tollNote: true,
  },
  {
    id: 'pune',
    nameKey: 'taxiGuestBooking.chartRows.pune',
    drop: 3400,
    return: 4000,
    tollNote: true,
  },
  {
    id: 'poladpur',
    nameKey: 'taxiGuestBooking.chartRows.poladpur',
    drop: 2000,
    return: 2300,
    tollNote: true,
  },
  {
    id: 'raigad',
    nameKey: 'taxiGuestBooking.chartRows.raigad',
    drop: null,
    return: 3500,
    tollNote: true,
  },
  {
    id: 'khed',
    nameKey: 'taxiGuestBooking.chartRows.khed',
    drop: 3000,
    return: 3500,
    tollNote: true,
  },
  {
    id: 'coastal',
    nameKey: 'taxiGuestBooking.chartRows.coastal',
    ratesLabelKey: 'taxiGuestBooking.chartRows.coastalRates',
    tollNote: true,
  },
  {
    id: 'mumbai',
    nameKey: 'taxiGuestBooking.chartRows.mumbai',
    drop: 16000,
    return: 17000,
    tollNote: true,
  },
];

export const TAXI_CLIENT_ROUTES = [...TAXI_LOCAL_TOURS, ...TAXI_OUTSTATION_ROUTES];

export const DEFAULT_TAXI_ROUTE_ID = TAXI_LOCAL_TOURS[0].id;

export function taxiRouteById(routeId) {
  if (routeId === 'murud') {
    return TAXI_OUTSTATION_ROUTES.find((r) => r.id === 'matheran') || TAXI_LOCAL_TOURS[0];
  }
  return TAXI_CLIENT_ROUTES.find((r) => r.id === routeId) || TAXI_LOCAL_TOURS[0];
}

export function taxiRoutePrice(routeId) {
  return taxiRouteById(routeId).price;
}
