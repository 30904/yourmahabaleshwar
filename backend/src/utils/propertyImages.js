import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', 'uploads', 'properties');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/** Persist data-URI images to disk; pass through http(s) URLs unchanged */
export async function normalizePropertyImages(images = []) {
  const normalized = [];

  for (const src of images) {
    if (!src || typeof src !== 'string') continue;

    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/uploads/')) {
      normalized.push(src);
      continue;
    }

    if (src.startsWith('data:image/')) {
      const match = src.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) continue;
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');
      const filename = `prop-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);
      normalized.push(`/uploads/properties/${filename}`);
      continue;
    }

    normalized.push(src);
  }

  return normalized;
}
