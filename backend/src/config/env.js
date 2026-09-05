import dotenv from 'dotenv';
import { validateEnv } from './validateEnv.js';

dotenv.config();

const defaultClientUrls = ['http://localhost:5173', 'http://localhost:5174'];

/** Always allowed — prevents production CORS breakage if CLIENT_URL is mis-set */
export const knownSiteOrigins = [
  'https://www.yourmahabaleshwar.com',
  'https://yourmahabaleshwar.com',
];

function parseClientUrls(value) {
  if (!value || !String(value).trim()) return defaultClientUrls;
  return String(value)
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function parseTrustProxy() {
  const raw = process.env.TRUST_PROXY;
  // Explicit opt-out for local (no reverse proxy). Default ON — production sits behind nginx/CF.
  if (raw === '0' || raw === 'false') return false;
  return true;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrls: parseClientUrls(process.env.CLIENT_URL),
  /** @deprecated use clientUrls */
  clientUrl: parseClientUrls(process.env.CLIENT_URL)[0] || defaultClientUrls[0],
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
  uploadPath: process.env.UPLOAD_PATH || './src/uploads',
  storagePrefix: (process.env.S3_PREFIX || process.env.STORAGE_PREFIX || 'your-mahabaleshwar').replace(/^\/|\/$/g, ''),
  cdnBaseUrl: (process.env.CLOUDFRONT_DOMAIN || process.env.CDN_BASE_URL || '').replace(/\/$/, ''),
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1',
    bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '',
    get enabled() {
      return Boolean(this.accessKeyId && this.secretAccessKey && this.bucket);
    },
  },
  trustProxy: parseTrustProxy(),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || (process.env.NODE_ENV === 'production' ? 100 : 200),
  publicApiUrl: process.env.PUBLIC_API_URL || '',
};

validateEnv({ nodeEnv: env.nodeEnv });
