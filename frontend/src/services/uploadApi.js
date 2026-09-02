import api from '../services/api';

/**
 * Upload a file to /api/storage/upload.
 * @param {File} file
 * @param {{ category: string, [key: string]: string }} meta
 */
export async function uploadStorageFile(file, meta = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('category', meta.category);
  Object.entries(meta).forEach(([key, value]) => {
    if (key !== 'category' && value != null && value !== '') {
      form.append(key, String(value));
    }
  });

  const { data } = await api.post('/storage/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

export async function fetchStorageConfig() {
  const { data } = await api.get('/storage/config');
  return data.data;
}
