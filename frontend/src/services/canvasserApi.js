import api from './api';

export const fetchCanvassers = (params) =>
  api.get('/admin/canvassers', { params }).then((r) => r.data.data);

export const fetchCanvasser = (id) =>
  api.get(`/admin/canvassers/${id}`).then((r) => r.data.data);

export const createCanvasser = (payload) =>
  api.post('/admin/canvassers', payload).then((r) => r.data.data);

export const updateCanvasser = (id, payload) =>
  api.patch(`/admin/canvassers/${id}`, payload).then((r) => r.data.data);
