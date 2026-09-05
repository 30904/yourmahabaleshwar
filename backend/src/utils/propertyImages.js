import { persistFile, isLegacyUploadPath } from '../services/storageService.js';

/** Persist data-URI images or pass through http(s) URLs, legacy paths, and storage keys */
export async function normalizePropertyImages(images = [], meta = {}) {
  const normalized = [];

  for (const src of images) {
    if (!src || typeof src !== 'string') continue;

    if (src.startsWith('http://') || src.startsWith('https://') || isLegacyUploadPath(src)) {
      normalized.push(src);
      continue;
    }

    if (src.startsWith('data:image/')) {
      const match = src.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) continue;
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');
      const saved = await persistFile({
        buffer,
        mimeType: `image/${match[1]}`,
        originalName: `upload.${ext}`,
        category: 'property-image',
        meta,
      });
      normalized.push(saved.key);
      continue;
    }

    normalized.push(src.replace(/^\/uploads\//, ''));
  }

  return normalized;
}
