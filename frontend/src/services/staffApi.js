import api from './api';

export const fetchStaffList = () => api.get('/admin/staff').then((r) => r.data.data);

export const fetchStaff = (id) => api.get(`/admin/staff/${id}`).then((r) => r.data.data);

export const createStaff = (payload) => api.post('/admin/staff', payload).then((r) => r.data.data);

export const updateStaff = (id, payload) => api.patch(`/admin/staff/${id}`, payload).then((r) => r.data.data);

export const resetStaffPassword = (id, password) =>
  api.post(`/admin/staff/${id}/reset-password`, { password }).then((r) => r.data);
