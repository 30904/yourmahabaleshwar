import api from './api';
import { ROLES } from '../constants/roles';

export const VERTICAL_PATH = {
  HOTEL: '/hotels',
  RESORT: '/resorts',
  HOMESTAY: '/homestays',
  TENT: '/tents',
  GUIDE: '/guides',
  TAXI: '/drivers',
  DRIVER: '/drivers',
  HORSE: '/horses',
  PRODUCT: '/products',
};

export const ROLE_DEFAULT_VERTICAL = {
  [ROLES.HOTEL_VENDOR]: 'HOTEL',
  [ROLES.HOMESTAY_VENDOR]: 'HOMESTAY',
  [ROLES.TENT_OPERATOR]: 'TENT',
  [ROLES.GUIDE]: 'GUIDE',
  [ROLES.TAXI_OPERATOR]: 'TAXI',
  [ROLES.DRIVER]: 'DRIVER',
  [ROLES.HORSE_OPERATOR]: 'HORSE',
  [ROLES.PRODUCT_VENDOR]: 'PRODUCT',
};

export const ROLE_CREATE_VERTICALS = {
  [ROLES.HOTEL_VENDOR]: ['HOTEL', 'RESORT'],
  [ROLES.HOMESTAY_VENDOR]: ['HOMESTAY'],
  [ROLES.TENT_OPERATOR]: ['TENT'],
  [ROLES.GUIDE]: ['GUIDE'],
  [ROLES.TAXI_OPERATOR]: ['TAXI'],
  [ROLES.DRIVER]: ['DRIVER'],
  [ROLES.HORSE_OPERATOR]: ['HORSE'],
  [ROLES.PRODUCT_VENDOR]: ['PRODUCT'],
};

export const ADMIN_CREATE_VERTICALS = [
  'HOTEL',
  'RESORT',
  'HOMESTAY',
  'TENT',
  'GUIDE',
  'TAXI',
  'DRIVER',
  'HORSE',
  'PRODUCT',
];

export const adminListingListPath = (vertical) => {
  const v = String(vertical || '').toUpperCase();
  const map = {
    HOTEL: '/admin/properties/hotels',
    RESORT: '/admin/properties/resorts',
    HOMESTAY: '/admin/properties/homestays',
    TENT: '/admin/properties/tents',
    GUIDE: '/admin/guides',
    TAXI: '/admin/taxi',
    DRIVER: '/admin/drivers',
    HORSE: '/admin/properties/horses',
    PRODUCT: '/admin/shop',
  };
  return map[v] || '/admin';
};

const MINE_BY_ROLE = {
  [ROLES.HOTEL_VENDOR]: [
    { path: '/hotels/mine', vertical: 'HOTEL', labelKey: 'vendor.types.hotel' },
    { path: '/resorts/mine', vertical: 'RESORT', labelKey: 'vendor.types.resort' },
  ],
  [ROLES.HOMESTAY_VENDOR]: [{ path: '/homestays/mine', vertical: 'HOMESTAY', labelKey: 'vendor.types.homestay' }],
  [ROLES.TENT_OPERATOR]: [{ path: '/tents/mine', vertical: 'TENT', labelKey: 'vendor.types.tent' }],
  [ROLES.GUIDE]: [{ path: '/guides/mine', vertical: 'GUIDE', labelKey: 'vendor.types.guide' }],
  [ROLES.TAXI_OPERATOR]: [{ path: '/drivers/mine', vertical: 'TAXI', labelKey: 'vendor.types.taxi' }],
  [ROLES.DRIVER]: [{ path: '/drivers/mine', vertical: 'DRIVER', labelKey: 'vendor.types.driver' }],
  [ROLES.HORSE_OPERATOR]: [{ path: '/horses/mine', vertical: 'HORSE', labelKey: 'vendor.types.horse' }],
  [ROLES.PRODUCT_VENDOR]: [{ path: '/products/mine', vertical: 'PRODUCT', labelKey: 'vendor.types.product' }],
};

const unwrapMine = (payload) => (Array.isArray(payload) ? payload : []);

export const fetchMyVendorListings = async (role) => {
  const specs = MINE_BY_ROLE[role] || [];
  const results = await Promise.allSettled(
    specs.map(({ path, vertical, labelKey }) =>
      api.get(path).then(({ data }) =>
        unwrapMine(data.data).map((item) => ({ ...item, vertical, labelKey }))
      )
    )
  );

  const listings = [];
  let failed = 0;
  results.forEach((result) => {
    if (result.status === 'fulfilled') listings.push(...result.value);
    else failed += 1;
  });

  if (failed && !listings.length) {
    throw new Error('Could not load listings');
  }
  return listings;
};

const baseFor = (vertical) => {
  const path = VERTICAL_PATH[String(vertical || '').toUpperCase()];
  if (!path) throw new Error('Unknown listing type');
  return path;
};

export const fetchMyVendorListing = async (vertical, id) => {
  const { data } = await api.get(`${baseFor(vertical)}/mine/${id}`);
  return data.data;
};

export const createVendorListing = async (vertical, payload) => {
  const { data } = await api.post(baseFor(vertical), payload);
  return data.data;
};

export const updateVendorListing = async (vertical, id, payload) => {
  const { data } = await api.put(`${baseFor(vertical)}/${id}`, payload);
  return data.data;
};

export const patchVendorListingPrices = async (vertical, id, payload) => {
  const { data } = await api.patch(`${baseFor(vertical)}/${id}/prices`, payload);
  return data.data;
};

export const fetchMyAvailability = async (from, to) => {
  const { data } = await api.get('/availability/mine', { params: { from, to } });
  return data.data || { listings: [] };
};

export const patchListingAvailability = async (type, id, payload) => {
  const { data } = await api.patch(`/availability/${type}/${id}`, payload);
  return data.data;
};

export const fetchVendorReviews = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/reviews/vendor', { params: { page, limit } });
  return data.data || { items: [], total: 0, page: 1, pages: 0 };
};
