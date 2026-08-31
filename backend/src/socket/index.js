import { Server } from 'socket.io';
import User from '../models/User.js';
import { env, knownSiteOrigins } from '../config/env.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { serviceTenantForRole } from '../constants/serviceMonetization.js';

let io = null;

const localhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const allowedOrigins = new Set([...env.clientUrls, ...knownSiteOrigins]);

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.has(normalized)) return callback(null, true);
  if (env.nodeEnv !== 'production' && localhostOrigin.test(normalized)) {
    return callback(null, true);
  }
  return callback(new Error(`CORS blocked for origin: ${origin}`));
}

export function tenantRoom(tenant) {
  return `tenant:${String(tenant || '').toUpperCase()}`;
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Unauthorized'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) return next(new Error('Unauthorized'));

      socket.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const tenant = serviceTenantForRole(socket.user.role);
    if (tenant) {
      socket.join(tenantRoom(tenant));
    }
    socket.join(`user:${socket.user._id}`);
  });

  return io;
}

export function getIo() {
  return io;
}
