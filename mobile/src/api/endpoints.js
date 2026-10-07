import api, { API_BASE } from './client';
import { Platform } from 'react-native';
import { readToken } from './tokenStore';
export const login = (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.data);
export const register = (payload) => api.post('/auth/register', payload).then((r) => r.data.data);
export const registerVendor = (payload) => api.post('/auth/register-vendor', payload).then((r) => r.data.data);
export const sendOtp = (payload) => api.post('/auth/otp/send', payload).then((r) => r.data.data);
export const verifyOtp = (payload) => api.post('/auth/otp/verify', payload).then((r) => r.data.data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data);
export const fetchMe = () => api.get('/auth/me').then((r) => r.data.data);
export const updateProfile = (body) => api.patch('/users/me', body).then((r) => r.data.data);
export const getWishlist = () => api.get('/users/wishlist').then((r) => r.data.data);
export const addWishlist = (itemId, itemType) => api.post('/users/wishlist', { itemId, itemType }).then((r) => r.data.data);
export const removeWishlist = (itemId, itemType) => api.delete(`/users/wishlist/${itemId}`, { params: { itemType } }).then((r) => r.data.data);
export const logoutApi = () => api.post('/auth/logout').then((r) => r.data);
export const listCatalog = (path, params) => api.get(path, { params }).then((r) => r.data.data);
export const globalSearch = (q) => api.get('/search', { params: { q, limit: 20 } }).then((r) => r.data.data);
export const publicFaqs = () => api.get('/admin/public/faqs').then((r) => r.data.data);
export const fetchServiceHubImages = () => api.get('/admin/public/service-hub-images').then((r) => r.data.data);
export const publicBlogs = () => api.get('/admin/public/blogs').then((r) => r.data.data);
export const sendEnquiry = (body) => api.post('/enquiries', body).then((r) => r.data);
export const getBySlug = (path, slug) => api.get(`${path}/${slug}`).then((r) => r.data.data);
export const fetchReviews = (listingType, listingId) => api.get('/reviews', { params: { listingType, listingId } }).then((r) => r.data.data || []);
export const createBooking = (type, body) => {
    const map = {
        HOTEL: '/bookings/hotel',
        RESORT: '/bookings/hotel',
        HOMESTAY: '/bookings/homestay',
        TENT: '/bookings/tent',
        GUIDE: '/bookings/guide',
        TAXI: '/bookings/taxi',
        DRIVER: '/bookings/taxi',
        HORSE: '/bookings/horse',
        PRODUCT: '/bookings/product',
        COMBO: '/bookings/combo',
    };
    return api.post(map[type] || '/bookings/hotel', body).then((r) => r.data.data);
};
export const myBookings = () => api.get('/bookings/my').then((r) => r.data.data);
export const vendorBookings = () => api.get('/bookings/vendor').then((r) => r.data.data);
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data.data);
export const vendorMarkArrived = (id) => api.patch(`/bookings/${id}/vendor-arrived`).then((r) => r.data.data);
export const confirmServiceArrival = (id) => api.patch(`/bookings/${id}/confirm-arrival`).then((r) => r.data.data);
export const vendorProposeEnd = (id, overtimeHours = 0) =>
  api.patch(`/bookings/${id}/propose-end`, { overtimeHours }).then((r) => r.data.data);
export const confirmServiceEnd = (id) => api.patch(`/bookings/${id}/confirm-end`).then((r) => r.data.data);
export const createPaymentOrder = (bookingId) => api.post('/payments/create-order', { bookingId }).then((r) => r.data.data);
export const verifyPayment = (payload) => api.post('/payments/verify', payload).then((r) => r.data.data);
export const requestRefund = (bookingId, reason) => api.post('/payments/refund', { bookingId, reason }).then((r) => r.data.data);
export const refundPreview = (bookingId) => api.get(`/payments/refund-preview/${bookingId}`).then((r) => r.data.data);
export const invoiceUrl = (bookingId) => `${api.defaults.baseURL}/bookings/${bookingId}/invoice`;

export async function downloadInvoice(bookingId) {
    if (Platform.OS === 'web') {
        const res = await api.get(`/bookings/${bookingId}/invoice`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(res.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${bookingId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return;
    }
    const { File, Paths } = await import('expo-file-system');
    const Sharing = await import('expo-sharing');
    const token = await readToken('accessToken');
    const destination = new File(Paths.cache, `invoice-${bookingId}.pdf`);
    const file = await File.downloadFileAsync(`${API_BASE}/bookings/${bookingId}/invoice`, destination, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        idempotent: true,
    });
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
}
export const getWallet = () => api.get('/admin/wallet').then((r) => r.data.data);
export const purchasePoints = (body) => api.post('/admin/subscriptions/points/purchase', body).then((r) => r.data.data);
export const getMySubscription = () => api.get('/admin/subscriptions/me').then((r) => r.data.data);
export const getMyKyc = () => api.get('/users/kyc').then((r) => r.data.data);
export const getDocumentRequirements = (vendorType) =>
    api.get('/admin/document-requirements', { params: { vendorType } }).then((r) => r.data.data);
export const submitKyc = (form) => api.post('/users/kyc', form).then((r) => r.data.data);
export const registerDevice = (payload) => api.post('/users/devices', payload).then((r) => r.data.data);
export const unregisterDevice = (token) =>
  api.delete(`/users/devices/${encodeURIComponent(token)}`).then((r) => r.data);
export const getNotifications = () => api.get('/users/notifications').then((r) => r.data.data);

const MINE_BY_ROLE = {
    HOTEL_VENDOR: [
        { path: '/hotels/mine', vertical: 'HOTEL', labelKey: 'vendor.types.HOTEL' },
        { path: '/resorts/mine', vertical: 'RESORT', labelKey: 'vendor.types.RESORT' },
    ],
    HOMESTAY_VENDOR: [{ path: '/homestays/mine', vertical: 'HOMESTAY', labelKey: 'vendor.types.HOMESTAY' }],
    TENT_OPERATOR: [{ path: '/tents/mine', vertical: 'TENT', labelKey: 'vendor.types.TENT' }],
    GUIDE: [{ path: '/guides/mine', vertical: 'GUIDE', labelKey: 'vendor.types.GUIDE' }],
    TAXI_OPERATOR: [{ path: '/drivers/mine', vertical: 'TAXI', labelKey: 'vendor.types.TAXI' }],
    DRIVER: [{ path: '/drivers/mine', vertical: 'DRIVER', labelKey: 'vendor.types.DRIVER' }],
    HORSE_OPERATOR: [{ path: '/horses/mine', vertical: 'HORSE', labelKey: 'vendor.types.HORSE' }],
    PRODUCT_VENDOR: [{ path: '/products/mine', vertical: 'PRODUCT', labelKey: 'vendor.types.PRODUCT' }],
};

export async function fetchMyVendorListings(role) {
    const specs = MINE_BY_ROLE[role] || [];
    const results = await Promise.allSettled(specs.map(async (spec) => {
        const rows = await api.get(spec.path).then((r) => r.data.data);
        return (Array.isArray(rows) ? rows : []).map((item) => ({
            ...item,
            vertical: spec.vertical,
            labelKey: spec.labelKey,
        }));
    }));
    const listings = [];
    let failed = 0;
    results.forEach((result) => {
        if (result.status === 'fulfilled')
            listings.push(...result.value);
        else
            failed += 1;
    });
    if (failed && !listings.length)
        throw new Error('Could not load listings');
    return listings;
}

const VERTICAL_PATH = {
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

const listingBase = (vertical) => {
    const path = VERTICAL_PATH[String(vertical || '').toUpperCase()];
    if (!path) throw new Error('Unknown listing type');
    return path;
};

export const fetchMyVendorListing = (vertical, id) => api.get(`${listingBase(vertical)}/mine/${id}`).then((r) => r.data.data);
export const createVendorListing = (vertical, payload) => api.post(listingBase(vertical), payload).then((r) => r.data.data);
export const updateVendorListing = (vertical, id, payload) => api.put(`${listingBase(vertical)}/${id}`, payload).then((r) => r.data.data);
export const patchVendorListingPrices = (vertical, id, payload) => api.patch(`${listingBase(vertical)}/${id}/prices`, payload).then((r) => r.data.data);
export const fetchMyAvailability = (from, to) => api.get('/availability/mine', { params: { from, to } }).then((r) => r.data.data);
export const patchListingAvailability = (type, id, payload) => api.patch(`/availability/${type}/${id}`, payload).then((r) => r.data.data);
export const fetchVendorReviews = ({ page = 1, limit = 20 } = {}) => api.get('/reviews/vendor', { params: { page, limit } }).then((r) => r.data.data);
export const fetchMyServiceMonetization = () => api.get('/service-monetization/me').then((r) => r.data.data);
export const orderServicePoints = (amount) => api.post('/service-monetization/points/order', { amount }).then((r) => r.data.data);
export const confirmServicePoints = (body) => api.post('/service-monetization/points/confirm', body).then((r) => r.data.data);
export const orderServiceUnlimited = () => api.post('/service-monetization/unlimited/order').then((r) => r.data.data);
export const confirmServiceUnlimited = (body) => api.post('/service-monetization/unlimited/confirm', body).then((r) => r.data.data);
export const fetchMyStaySubscriptions = () => api.get('/stay-subscriptions/mine').then((r) => r.data.data?.items || []);
export const orderStayRenewal = (listingType, listingId) => api.post(`/stay-subscriptions/${listingType}/${listingId}/renew/order`).then((r) => r.data.data);
export const confirmStayRenewal = (listingType, listingId, body) => api.post(`/stay-subscriptions/${listingType}/${listingId}/renew/confirm`, body).then((r) => r.data.data);
export const fetchVendorAdCatalog = () => api.get('/ads/packages').then((r) => r.data.data);
export const fetchMyHomepageAds = () => api.get('/ads/mine').then((r) => r.data.data?.items || []);
export const fetchHomepageHeroAds = () => api.get('/ads/homepage-hero').then((r) => r.data.data?.items || []);
export const trackHomepageAdEvent = (adId, event = 'impression') => api.post(`/ads/${adId}/track`, { event }).catch(() => null);
export const orderHomepageAd = (body) => api.post('/ads/order', body).then((r) => r.data.data);
export const confirmHomepageAd = (body) => api.post('/ads/confirm', body).then((r) => r.data.data);
export const fetchFormSchema = (tenant) => api.get('/admin/public/form-schemas', { params: { formKind: 'vendor', tenant } }).then((r) => r.data.data);
