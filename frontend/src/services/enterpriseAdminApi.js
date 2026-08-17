import api from './api';

export const fetchEnterpriseDashboard = () =>
  api.get('/admin/enterprise/dashboard').then((r) => r.data.data);

export const fetchAdminProperties = (params) =>
  api.get('/admin/enterprise/properties', { params }).then((r) => r.data.data);

export const fetchAdminProperty = (id) =>
  api.get(`/admin/enterprise/properties/${id}`).then((r) => r.data.data);

export const createAdminProperty = (payload) =>
  api.post('/admin/enterprise/properties', payload).then((r) => r.data.data);

export const updateAdminProperty = (id, payload) =>
  api.put(`/admin/enterprise/properties/${id}`, payload).then((r) => r.data.data);

export const setAdminPropertyActive = (id, { isActive, listingType }) =>
  api
    .patch(`/admin/enterprise/properties/${id}/status`, { isActive, listingType })
    .then((r) => r.data.data);

export const fetchAdminBookings = (params) =>
  api.get('/admin/enterprise/bookings', { params }).then((r) => r.data.data);

export const fetchAdminGuides = (params) =>
  api.get('/admin/enterprise/guides', { params }).then((r) => r.data.data);

export const fetchAdminDrivers = (params) =>
  api.get('/admin/enterprise/drivers', { params }).then((r) => r.data.data);

/** Domain master-data CRUD (guides, drivers, tents, homestays, horses) */
export const createDriver = (body) => api.post('/drivers', body).then((r) => r.data.data);
export const updateDriver = (id, body) => api.put(`/drivers/${id}`, body).then((r) => r.data.data);
export const deleteDriver = (id) => api.delete(`/drivers/${id}`).then((r) => r.data);

export const createGuide = (body) => api.post('/guides', body).then((r) => r.data.data);
export const updateGuide = (id, body) => api.put(`/guides/${id}`, body).then((r) => r.data.data);
export const deleteGuide = (id) => api.delete(`/guides/${id}`).then((r) => r.data);

export const createTent = (body) => api.post('/tents', body).then((r) => r.data.data);
export const updateTent = (id, body) => api.put(`/tents/${id}`, body).then((r) => r.data.data);
export const deleteTent = (id) => api.delete(`/tents/${id}`).then((r) => r.data);

export const createHomestay = (body) => api.post('/homestays', body).then((r) => r.data.data);
export const updateHomestay = (id, body) => api.put(`/homestays/${id}`, body).then((r) => r.data.data);
export const deleteHomestay = (id) => api.delete(`/homestays/${id}`).then((r) => r.data);

export const createHorse = (body) => api.post('/horses', body).then((r) => r.data.data);
export const updateHorse = (id, body) => api.put(`/horses/${id}`, body).then((r) => r.data.data);
export const deleteHorse = (id) => api.delete(`/horses/${id}`).then((r) => r.data);

export const updateHotel = (id, body) => api.put(`/hotels/${id}`, body).then((r) => r.data.data);
export const deleteHotel = (id) => api.delete(`/hotels/${id}`).then((r) => r.data);

export const createProduct = (body) => api.post('/products', body).then((r) => r.data.data);
export const updateProduct = (id, body) => api.put(`/products/${id}`, body).then((r) => r.data.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);

export const createCombo = (body) => api.post('/combos', body).then((r) => r.data.data);
export const updateCombo = (id, body) => api.put(`/combos/${id}`, body).then((r) => r.data.data);
export const deleteCombo = (id) => api.delete(`/combos/${id}`).then((r) => r.data);

export const fetchAdminVendors = (params) =>
  api.get('/admin/enterprise/vendors', { params }).then((r) => r.data.data);

export const fetchAdminCustomers = () =>
  api.get('/admin/enterprise/customers').then((r) => r.data.data);

export const fetchCoupons = () =>
  api.get('/admin/enterprise/coupons').then((r) => r.data.data);

export const createCoupon = (payload) =>
  api.post('/admin/enterprise/coupons', payload).then((r) => r.data.data);

export const updateCoupon = (id, payload) =>
  api.patch(`/admin/enterprise/coupons/${id}`, payload).then((r) => r.data.data);

export const fetchPlatformSettings = () =>
  api.get('/admin/enterprise/settings').then((r) => r.data.data);

export const updatePlatformSettings = (payload) =>
  api.put('/admin/enterprise/settings', payload).then((r) => r.data.data);

export const fetchFinanceSummary = () =>
  api.get('/admin/enterprise/finance').then((r) => r.data.data);

export const fetchKycList = () => api.get('/admin/kyc').then((r) => r.data.data);
export const updateKyc = (id, body) => api.patch(`/admin/kyc/${id}`, body).then((r) => r.data.data);
export const fetchCmsBanners = () => api.get('/admin/banners').then((r) => r.data.data);
export const createBanner = (fields, imageFile) => {
  const form = new FormData();
  form.append('title', fields.title);
  if (fields.subtitle) form.append('subtitle', fields.subtitle);
  if (fields.link) form.append('link', fields.link);
  if (fields.vertical) form.append('vertical', fields.vertical);
  if (imageFile) form.append('image', imageFile);
  else if (fields.imageUrl) form.append('imageUrl', fields.imageUrl);
  return api.post('/admin/banners', form).then((r) => r.data.data);
};
export const fetchCmsBlogs = () => api.get('/admin/blogs').then((r) => r.data.data);

export const fetchCmsBlog = (id) => api.get(`/admin/blogs/${id}`).then((r) => r.data.data);

const blogFormData = (fields, coverFile) => {
  const form = new FormData();
  form.append('title', fields.title);
  form.append('excerpt', fields.excerpt || '');
  form.append('content', fields.content || '');
  form.append('tags', fields.tags || '');
  form.append('isPublished', String(fields.isPublished !== false));
  if (fields.slug) form.append('slug', fields.slug);
  if (coverFile) form.append('coverImage', coverFile);
  else if (fields.coverImageUrl) form.append('coverImageUrl', fields.coverImageUrl);
  return form;
};

export const createBlog = (fields, coverFile) =>
  api.post('/admin/blogs', blogFormData(fields, coverFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.data);

export const updateBlog = (id, fields, coverFile) =>
  api.put(`/admin/blogs/${id}`, blogFormData(fields, coverFile), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.data);

export const deleteBlog = (id) => api.delete(`/admin/blogs/${id}`).then((r) => r.data);
export const fetchCmsFaqs = () => api.get('/admin/faqs').then((r) => r.data.data);
export const createFaq = (body) => api.post('/admin/faqs', body).then((r) => r.data.data);
export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data.data);

export const fetchUploadTypes = () =>
  api.get('/admin/upload-center/types').then((r) => r.data.data);

export const downloadUploadTemplate = async (type) => {
  const { data } = await api.get(`/admin/upload-center/templates/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}-template.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const fetchAmenities = (params) =>
  api.get('/admin/catalog/amenities', { params }).then((r) => r.data.data);

export const createAmenity = (body) =>
  api.post('/admin/catalog/amenities', body).then((r) => r.data.data);

export const updateAmenity = (id, body) =>
  api.put(`/admin/catalog/amenities/${id}`, body).then((r) => r.data.data);

export const deleteAmenity = (id) =>
  api.delete(`/admin/catalog/amenities/${id}`).then((r) => r.data);

export const fetchRoomTypes = (params) =>
  api.get('/admin/catalog/room-types', { params }).then((r) => r.data.data);

export const createRoomType = (body) =>
  api.post('/admin/catalog/room-types', body).then((r) => r.data.data);

export const updateRoomType = (id, body) =>
  api.put(`/admin/catalog/room-types/${id}`, body).then((r) => r.data.data);

export const deleteRoomType = (id) =>
  api.delete(`/admin/catalog/room-types/${id}`).then((r) => r.data);

export const importUploadData = (type, file) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post(`/admin/upload-center/import/${type}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

// Phase 1B
export const seedPhase1bDefaults = () =>
  api.post('/admin/phase1b/seed-defaults').then((r) => r.data.data);

export const fetchSubscriptionPlans = () =>
  api.get('/admin/subscriptions/plans').then((r) => r.data.data);

export const createSubscriptionPlan = (body) =>
  api.post('/admin/subscriptions/plans', body).then((r) => r.data.data);

export const fetchSubscriptions = (params) =>
  api.get('/admin/subscriptions', { params }).then((r) => r.data.data);

export const assignSubscription = (body) =>
  api.post('/admin/subscriptions/assign', body).then((r) => r.data.data);

export const purchaseVendorPoints = (body) =>
  api.post('/admin/subscriptions/points/purchase', body).then((r) => r.data.data);

export const fetchWallet = (params) =>
  api.get('/admin/wallet', { params }).then((r) => r.data.data);

export const generatePayouts = () =>
  api.post('/admin/payouts/generate').then((r) => r.data.data);

export const fetchDetailedPayouts = (params) =>
  api.get('/admin/payouts/detailed', { params }).then((r) => r.data.data);

export const updatePayout = (id, body) =>
  api.patch(`/admin/payouts/${id}`, body).then((r) => r.data.data);

export const fetchAdPackages = () =>
  api.get('/admin/ads/packages').then((r) => r.data.data);

export const createAdPackage = (body) =>
  api.post('/admin/ads/packages', body).then((r) => r.data.data);

export const fetchAdvertisements = (params) =>
  api.get('/admin/ads', { params }).then((r) => r.data.data);

export const createAdvertisement = (body) =>
  api.post('/admin/ads', body).then((r) => r.data.data);

export const fetchAdAnalytics = () =>
  api.get('/admin/ads/analytics').then((r) => r.data.data);

export const fetchFeaturedListings = () =>
  api.get('/admin/ads/featured').then((r) => r.data.data);

export const setFeaturedListing = (body) =>
  api.post('/admin/ads/featured', body).then((r) => r.data.data);

export const fetchCampaigns = () =>
  api.get('/admin/campaigns').then((r) => r.data.data);

export const createCampaign = (body) =>
  api.post('/admin/campaigns', body).then((r) => r.data.data);

export const sendCampaign = (id) =>
  api.post(`/admin/campaigns/${id}/send`).then((r) => r.data.data);

export const fetchReportsHub = (params) =>
  api.get('/admin/reports/hub', { params }).then((r) => r.data.data);

export const fetchBackups = () =>
  api.get('/admin/backups').then((r) => r.data.data);

export const triggerBackup = (body) =>
  api.post('/admin/backups', body).then((r) => r.data.data);

export const restoreBackup = (id) =>
  api.post(`/admin/backups/${id}/restore`).then((r) => r.data.data);
