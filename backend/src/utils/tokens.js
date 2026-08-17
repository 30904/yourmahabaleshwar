import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpire });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpire });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
