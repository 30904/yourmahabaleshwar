import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;
let connectPromise = null;

/**
 * Shared Redis client for booking locks / concurrency control.
 * Returns null when REDIS_URL is not configured.
 */
export const getRedis = () => {
  if (!env.redisUrl) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 2000);
    },
  });

  redisClient.on('ready', () => console.log('Redis connected'));
  redisClient.on('error', (err) => console.error('Redis error:', err.message));
  redisClient.on('end', () => {
    /* keep client; reconnect handled by ioredis */
  });

  return redisClient;
};

export const isRedisReady = () => {
  const client = redisClient;
  return Boolean(client && (client.status === 'ready' || client.status === 'connect'));
};

/** Ensure Redis is connected when REDIS_URL is set. */
export const ensureRedis = async () => {
  const client = getRedis();
  if (!client) return null;
  if (client.status === 'ready') return client;
  if (!connectPromise) {
    connectPromise = client
      .connect()
      .catch((err) => {
        console.error('Redis connect failed:', err.message);
        return null;
      })
      .finally(() => {
        connectPromise = null;
      });
  }
  await connectPromise;
  return client.status === 'ready' ? client : null;
};

export const closeRedis = async () => {
  if (!redisClient) return;
  try {
    await redisClient.quit();
  } catch {
    try {
      redisClient.disconnect();
    } catch {
      /* ignore */
    }
  }
  redisClient = null;
};
