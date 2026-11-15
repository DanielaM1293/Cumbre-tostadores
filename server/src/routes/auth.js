import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db } from '../db.js';
import { HttpError, parse } from '../lib/http.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

const loginBody = z.object({
  email: z.string().trim().toLowerCase().email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = parse(loginBody, req.body);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Mismo mensaje para correo o contraseña incorrectos, para no revelar qué usuarios existen.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  res.json({ token: signToken(user), user: { id: user.id, email: user.email } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.sub, email: req.user.email } });
});

export default router;
