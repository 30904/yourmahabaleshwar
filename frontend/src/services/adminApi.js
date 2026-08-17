import api from './api';

export const fetchDashboardStats = async () => {
  const res = await api.get('/admin/dashboard');
  return res.data.data;
};

export const fetchKycList = async () => {
  const res = await api.get('/admin/kyc');
  return res.data.data || [];
};

export const updateKyc = async (id, body) => {
  const res = await api.patch(`/admin/kyc/${id}`, body);
  return res.data.data;
};

export const fetchCmsFaqs = async () => {
  const res = await api.get('/admin/faqs');
  return res.data.data || [];
};

export const fetchCmsBlogs = async () => {
  const res = await api.get('/admin/blogs');
  return res.data.data || [];
};

export const fetchCmsBanners = async () => {
  const res = await api.get('/admin/banners');
  return res.data.data || [];
};
