import api from './api';

export const fetchPublicFormSchema = async (formKind, tenant) => {
  const { data } = await api.get('/admin/public/form-schemas', { params: { formKind, tenant } });
  return data.data;
};

export const fetchAdminFormSchema = async (formKind, tenant) => {
  const { data } = await api.get('/admin/form-schemas', { params: { formKind, tenant } });
  return data.data;
};

export const saveAdminFormSchema = async (payload) => {
  const { data } = await api.put('/admin/form-schemas', payload);
  return data.data;
};

export const seedAdminFormSchemas = async () => {
  const { data } = await api.post('/admin/form-schemas/seed');
  return data.data;
};
