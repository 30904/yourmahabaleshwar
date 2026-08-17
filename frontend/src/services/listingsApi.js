import api from './api';
import { extractItems, normalizeHotel, normalizeTent, normalizeGuide, normalizeDriver, normalizeHomestay, normalizeHorse } from '../utils/listingHelpers';

export const fetchHotels = async (params = {}) => {
  const res = await api.get('/hotels', { params });
  return extractItems(res).map(normalizeHotel);
};

export const fetchHotelBySlug = async (slug) => {
  const res = await api.get(`/hotels/${slug}`);
  const { hotel, rooms } = res.data.data || {};
  return { hotel: normalizeHotel(hotel), rooms: rooms || [] };
};

export const fetchTents = async (params = {}) => {
  const res = await api.get('/tents', { params });
  return extractItems(res).map(normalizeTent);
};

export const fetchTentBySlug = async (slug) => {
  const res = await api.get(`/tents/${slug}`);
  return normalizeTent(res.data.data);
};

export const fetchGuides = async (params = {}) => {
  const res = await api.get('/guides', { params });
  return extractItems(res).map(normalizeGuide);
};

export const fetchGuideBySlug = async (slug) => {
  const res = await api.get(`/guides/${slug}`);
  return normalizeGuide(res.data.data);
};

export const fetchDrivers = async (params = {}) => {
  const res = await api.get('/drivers', { params });
  return extractItems(res).map(normalizeDriver);
};

export const fetchDriverBySlug = async (slug) => {
  const res = await api.get(`/drivers/${slug}`);
  return normalizeDriver(res.data.data);
};

export const fetchHomestays = async (params = {}) => {
  const res = await api.get('/homestays', { params });
  return extractItems(res).map(normalizeHomestay);
};

export const fetchHomestayBySlug = async (slug) => {
  const res = await api.get(`/homestays/${slug}`);
  return normalizeHomestay(res.data.data);
};

export const fetchHorses = async (params = {}) => {
  const res = await api.get('/horses', { params });
  return extractItems(res).map(normalizeHorse);
};

export const fetchProducts = async (params = {}) => {
  const res = await api.get('/products', { params });
  return extractItems(res);
};

export const fetchProductBySlug = async (slug) => {
  const res = await api.get(`/products/${slug}`);
  return res.data.data;
};

export const fetchCombos = async (params = {}) => {
  const res = await api.get('/combos', { params });
  return extractItems(res);
};

export const fetchComboBySlug = async (slug) => {
  const res = await api.get(`/combos/${slug}`);
  return res.data.data;
};

export const fetchHorseBySlug = async (slug) => {
  const res = await api.get(`/horses/${slug}`);
  return normalizeHorse(res.data.data);
};

export const fetchAvailability = async (type, id, from, to) => {
  const res = await api.get(`/availability/${type}/${id}`, { params: { from, to } });
  return res.data.data || { unavailable: [] };
};

export const globalSearch = async (q) => {
  const res = await api.get('/search', { params: { q, limit: 20 } });
  const data = res.data.data || {};
  return {
    hotels: (data.hotels || []).map(normalizeHotel),
    tents: (data.tents || []).map(normalizeTent),
    guides: (data.guides || []).map(normalizeGuide),
    drivers: (data.drivers || []).map(normalizeDriver),
    homestays: (data.homestays || []).map(normalizeHomestay),
    horses: (data.horses || []).map(normalizeHorse),
  };
};

export const fetchPublicFaqs = async () => {
  const res = await api.get('/admin/public/faqs');
  return res.data.data || [];
};

export const fetchPublicBlogs = async () => {
  const res = await api.get('/admin/public/blogs');
  return res.data.data || [];
};

export const fetchPublicBanners = async () => {
  const res = await api.get('/admin/public/banners');
  return res.data.data || [];
};

export const fetchReviews = async (listingType, listingId) => {
  const res = await api.get('/reviews', { params: { listingType, listingId } });
  return res.data.data || [];
};

export const createReview = async (payload) => {
  const res = await api.post('/reviews', payload);
  return res.data.data;
};
