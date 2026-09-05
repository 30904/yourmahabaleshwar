import path from 'path';
import { env } from './env.js';

const SAFE_SEGMENT = /[^a-zA-Z0-9._-]/g;

export function sanitizeSegment(value, fallback = 'unknown') {
  const cleaned = String(value || '')
    .trim()
    .replace(SAFE_SEGMENT, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || fallback;
}

export function uniqueFilename(originalName = 'file') {
  const ext = path.extname(originalName).toLowerCase() || '';
  const stamp = Date.now();
  const rand = Math.round(Math.random() * 1e9);
  return `${stamp}-${rand}${ext}`;
}

/**
 * Object key relative to bucket / local uploads root (no leading slash).
 * Hierarchy:
 *   {prefix}/kyc/{userId}/{docField}/{file}
 *   {prefix}/listings/{tenant}/{ownerId}/images/{file}
 *   {prefix}/listings/{tenant}/{listingId}/images/{file}
 *   {prefix}/properties/{propertyId}/images/{file}
 *   {prefix}/bookings/{bookingOrUserId}/id-proof/{file}
 *   {prefix}/cms/banners/{bannerId}/{file}
 *   {prefix}/cms/blogs/{blogId}/{file}
 *   {prefix}/products/{productId}/{file}
 */
export function buildObjectKey(category, meta = {}, originalName = 'file') {
  const prefix = env.storagePrefix;
  const filename = uniqueFilename(originalName);
  const parts = prefix ? [prefix] : [];

  switch (category) {
    case 'kyc': {
      const userId = sanitizeSegment(meta.userId, 'user');
      const docField = sanitizeSegment(meta.docField, 'document');
      parts.push('kyc', userId, docField, filename);
      break;
    }
    case 'listing-image': {
      const tenant = sanitizeSegment(meta.tenant, 'listing');
      const ownerId = sanitizeSegment(meta.listingId || meta.ownerId || meta.userId, 'draft');
      parts.push('listings', tenant, ownerId, 'images', filename);
      break;
    }
    case 'property-image': {
      const propertyId = sanitizeSegment(meta.propertyId || meta.userId, 'draft');
      parts.push('properties', propertyId, 'images', filename);
      break;
    }
    case 'booking-id-proof': {
      const bookingId = sanitizeSegment(meta.bookingId || meta.userId, 'guest');
      parts.push('bookings', bookingId, 'id-proof', filename);
      break;
    }
    case 'cms-banner': {
      const bannerId = sanitizeSegment(meta.bannerId || 'new', 'new');
      parts.push('cms', 'banners', bannerId, filename);
      break;
    }
    case 'cms-blog': {
      const blogId = sanitizeSegment(meta.blogId || 'new', 'new');
      parts.push('cms', 'blogs', blogId, filename);
      break;
    }
    case 'product-image': {
      const productId = sanitizeSegment(meta.productId || 'new', 'new');
      parts.push('products', productId, filename);
      break;
    }
    case 'staff-doc': {
      const staffId = sanitizeSegment(meta.staffId || meta.userId || 'new', 'new');
      const docField = sanitizeSegment(meta.docField, 'document');
      parts.push('staff', staffId, docField, filename);
      break;
    }
    default:
      parts.push('misc', sanitizeSegment(category, 'file'), filename);
  }

  return parts.join('/');
}

export const UPLOAD_CATEGORIES = [
  'kyc',
  'listing-image',
  'property-image',
  'booking-id-proof',
  'cms-banner',
  'cms-blog',
  'product-image',
  'staff-doc',
];
