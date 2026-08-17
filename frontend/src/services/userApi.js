import api from './api';

export const fetchWishlist = async () => {
  const res = await api.get('/users/wishlist');
  return res.data.data || [];
};

export const addToWishlist = async (itemId, itemType) => {
  const res = await api.post('/users/wishlist', { itemId, itemType });
  return res.data.data;
};

export const removeFromWishlist = async (itemId, itemType) => {
  const res = await api.delete(`/users/wishlist/${itemId}`, { params: { itemType } });
  return res.data.data;
};

export const fetchNotifications = async (unreadOnly = false) => {
  const res = await api.get('/users/notifications', { params: { unread: unreadOnly } });
  return res.data.data || [];
};

export const markNotificationRead = async (id) => {
  const res = await api.patch(`/users/notifications/${id}/read`);
  return res.data.data;
};

export const markAllNotificationsRead = async () => {
  await api.post('/users/notifications/read-all');
};
