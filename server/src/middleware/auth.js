import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function verify(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

export function requireAuth(req, _res, next) {
  const token = readToken(req);
  const payload = token && verify(token);
  if (!payload) throw new HttpError(401, 'Inicia sesión para continuar.');
  req.user = payload;
  next();
}

// Deja pasar a cualquiera, pero marca `req.user` si trae un token válido.
export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  req.user = (token && verify(token)) || null;
  next();
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpires });
}
