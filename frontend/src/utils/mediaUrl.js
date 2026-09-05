/** Resolve stored upload keys, legacy /uploads paths, or external URLs for <img src> */
export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;

  const cdn = import.meta.env.VITE_CDN_URL || import.meta.env.VITE_CLOUDFRONT_URL || '';
  if (cdn) {
    const key = path.startsWith('/uploads/') ? path.replace(/^\/uploads\//, '') : path.replace(/^\/+/, '');
    return `${cdn.replace(/\/$/, '')}/${key}`;
  }

  if (path.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const origin = apiBase.replace(/\/api\/?$/, '') || '';
    return `${origin}${path}`;
  }

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = apiBase.replace(/\/api\/?$/, '') || '';
  return `${origin}/uploads/${path.replace(/^\/+/, '')}`;
}

/** Resolve an array of stored image paths/keys for galleries. */
export function resolveMediaUrls(images = []) {
  return (images || []).map((src) => getMediaUrl(src)).filter(Boolean);
}

/** Primary cover image for any listing type (images[], photo, or imageUrl). */
export function listingCoverImage(item) {
  const raw = item?.images?.[0] || item?.photo || item?.imageUrl || item?.coverImage || '';
  return getMediaUrl(raw);
}

export function isPdfUrl(path) {
  return String(path || '').toLowerCase().endsWith('.pdf');
}

export function isImageUrl(path) {
  if (!path) return false;
  if (path.startsWith('data:image/')) return true;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(path);
}
