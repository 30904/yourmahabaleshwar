import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { env, knownSiteOrigins } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { startScheduledJobs } from './jobs/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Required behind nginx / Cloudflare so rate-limit uses the real client IP
if (env.trustProxy) {
  app.set('trust proxy', 1);
}

connectDB();
startScheduledJobs();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
  })
);

const localhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const allowedOrigins = new Set([...env.clientUrls, ...knownSiteOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.has(normalized)) return callback(null, true);
      if (env.nodeEnv !== 'production' && localhostOrigin.test(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Razorpay webhook needs raw body for HMAC verification (before JSON parser)
app.post(
  '/api/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    try {
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch {
      req.body = {};
    }
    const { razorpayWebhook } = await import('./controllers/webhookController.js');
    return razorpayWebhook(req, res);
  }
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Tighter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

app.get('/healthz', (req, res) => {
  res.status(200).json({
    ok: true,
    env: env.nodeEnv,
    time: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  if (env.nodeEnv === 'production') {
    console.log(`CORS origins: ${env.clientUrls.join(', ')}`);
  }
});
