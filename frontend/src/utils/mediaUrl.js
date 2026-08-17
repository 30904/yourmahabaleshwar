/** Resolve stored upload paths or external URLs for <img src> */
export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = apiBase.replace(/\/api\/?$/, '') || '';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
