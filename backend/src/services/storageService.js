import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';
import { buildObjectKey } from '../config/storagePaths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadRoot = path.resolve(__dirname, '..', 'uploads');

let s3Client = null;

function getS3Client() {
  if (!env.s3.enabled) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.s3.region,
      credentials: {
        accessKeyId: env.s3.accessKeyId,
        secretAccessKey: env.s3.secretAccessKey,
      },
    });
  }
  return s3Client;
}

/** Stored reference — logical object key (no bucket, no leading slash). */
export function isLegacyUploadPath(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

/**
 * Resolve a stored key or legacy `/uploads/...` path to a public URL.
 */
export function resolvePublicUrl(stored) {
  if (!stored || typeof stored !== 'string') return '';
  if (stored.startsWith('http://') || stored.startsWith('https://') || stored.startsWith('data:')) {
    return stored;
  }

  if (isLegacyUploadPath(stored)) {
    if (env.cdnBaseUrl) {
      const key = stored.replace(/^\/uploads\//, '');
      return `${env.cdnBaseUrl.replace(/\/$/, '')}/${key}`;
    }
    const apiBase = env.publicApiUrl || `http://localhost:${env.port}`;
    return `${apiBase.replace(/\/$/, '')}${stored}`;
  }

  const key = stored.replace(/^\/+/, '');
  if (env.cdnBaseUrl) {
    return `${env.cdnBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  const apiBase = env.publicApiUrl || `http://localhost:${env.port}`;
  return `${apiBase.replace(/\/$/, '')}/uploads/${key}`;
}

async function saveLocal(key, buffer) {
  const filepath = path.join(localUploadRoot, key);
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, buffer);
  return key;
}

async function saveS3(key, buffer, mimeType) {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return key;
}

/**
 * Persist a file buffer and return storage metadata.
 * @returns {{ key: string, url: string, storage: 's3' | 'local' }}
 */
export async function persistFile({ buffer, mimeType, originalName, category, meta = {} }) {
  if (!buffer?.length) throw new Error('Empty file buffer');

  const key = buildObjectKey(category, meta, originalName);
  const storage = env.s3.enabled ? 's3' : 'local';

  if (storage === 's3') {
    await saveS3(key, buffer, mimeType);
  } else {
    await saveLocal(key, buffer);
  }

  return {
    key,
    url: resolvePublicUrl(key),
    storage,
  };
}

/** Multer memory file → persisted storage */
export async function persistMulterFile(file, category, meta = {}) {
  if (!file) return null;
  return persistFile({
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
    category,
    meta,
  });
}

export async function persistMulterFiles(filesMap, category, metaFactory) {
  const result = {};
  if (!filesMap) return result;

  for (const [field, arr] of Object.entries(filesMap)) {
    const file = arr?.[0];
    if (!file) continue;
    const meta = typeof metaFactory === 'function' ? metaFactory(field, file) : metaFactory;
    const saved = await persistMulterFile(file, category, meta);
    if (saved) result[field] = saved.key;
  }
  return result;
}

export function getStorageInfo() {
  return {
    provider: env.s3.enabled ? 's3' : 'local',
    bucket: env.s3.bucket || null,
    region: env.s3.region || null,
    cdnBaseUrl: env.cdnBaseUrl || null,
    prefix: env.storagePrefix || '',
  };
}
