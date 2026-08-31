import api from './api';

export const fetchOpenServiceBookings = async () => {
  const res = await api.get('/bookings/vendor/open');
  return res.data.data || [];
};

export const acceptOpenServiceBooking = async (bookingId) => {
  const res = await api.patch(`/bookings/${bookingId}/accept`);
  return res.data.data;
};
