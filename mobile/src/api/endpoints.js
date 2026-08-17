import api from './client';
export const login = (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.data);
export const register = (payload) => api.post('/auth/register', payload).then((r) => r.data.data);
export const registerVendor = (payload) => api.post('/auth/register-vendor', payload).then((r) => r.data.data);
export const sendOtp = (payload) => api.post('/auth/otp/send', payload).then((r) => r.data.data);
export const verifyOtp = (payload) => api.post('/auth/otp/verify', payload).then((r) => r.data.data);
export const fetchMe = () => api.get('/auth/me').then((r) => r.data.data);
export const logoutApi = () => api.post('/auth/logout').then((r) => r.data);
export const listCatalog = (path, params) => api.get(path, { params }).then((r) => r.data.data);
export const getBySlug = (path, slug) => api.get(`${path}/${slug}`).then((r) => r.data.data);
export const createBooking = (type, body) => {
    const map = {
        HOTEL: '/bookings/hotel',
        RESORT: '/bookings/hotel',
        HOMESTAY: '/bookings/homestay',
        TENT: '/bookings/tent',
        GUIDE: '/bookings/guide',
        TAXI: '/bookings/taxi',
        HORSE: '/bookings/horse',
        PRODUCT: '/bookings/product',
        COMBO: '/bookings/combo',
    };
    return api.post(map[type] || '/bookings/hotel', body).then((r) => r.data.data);
};
export const myBookings = () => api.get('/bookings/my').then((r) => r.data.data);
export const vendorBookings = () => api.get('/bookings/vendor').then((r) => r.data.data);
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data.data);
export const createPaymentOrder = (bookingId) => api.post('/payments/create-order', { bookingId }).then((r) => r.data.data);
export const verifyPayment = (payload) => api.post('/payments/verify', payload).then((r) => r.data.data);
export const requestRefund = (bookingId, reason) => api.post('/payments/refund', { bookingId, reason }).then((r) => r.data.data);
export const invoiceUrl = (bookingId) => `${api.defaults.baseURL}/bookings/${bookingId}/invoice`;
export const getWallet = () => api.get('/admin/wallet').then((r) => r.data.data);
export const getMySubscription = () => api.get('/admin/subscriptions/me').then((r) => r.data.data);
export const getMyKyc = () => api.get('/users/kyc').then((r) => r.data.data);
export const submitKyc = (form) => api.post('/users/kyc', form).then((r) => r.data.data);
export const registerDevice = (payload) => api.post('/users/devices', payload).then((r) => r.data.data);
export const getNotifications = () => api.get('/users/notifications').then((r) => r.data.data);
