import api from './api';

export const fetchMyBookings = async (status) => {
  const res = await api.get('/bookings/my', { params: status ? { status } : {} });
  return res.data.data || [];
};

export const fetchVendorBookings = async () => {
  const res = await api.get('/bookings/vendor');
  return res.data.data || [];
};

export const fetchAllBookings = async () => {
  const res = await api.get('/bookings/all');
  return res.data.data || [];
};

export const updateBookingStatus = async (id, status, cancellationReason) => {
  const res = await api.patch(`/bookings/${id}/status`, { status, cancellationReason });
  return res.data.data;
};

export const createHotelBooking = (payload) => api.post('/bookings/hotel', payload);
export const createTentBooking = (payload) => api.post('/bookings/tent', payload);
export const createGuideBooking = (payload) => api.post('/bookings/guide', payload);
export const createTaxiBooking = (payload) => api.post('/bookings/taxi', payload);
export const createHomestayBooking = (payload) => api.post('/bookings/homestay', payload);
export const createHorseBooking = (payload) => api.post('/bookings/horse', payload);
export const createProductOrder = async (payload) => {
  const res = await api.post('/bookings/product', payload);
  return res.data.data;
};
export const createComboBooking = async (payload) => {
  const res = await api.post('/bookings/combo', payload);
  return res.data.data;
};

export const downloadInvoice = async (bookingId) => {
  const res = await api.get(`/bookings/${bookingId}/invoice`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice-${bookingId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
