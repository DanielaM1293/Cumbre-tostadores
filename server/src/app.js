import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config, mpEnabled } from './config.js';
import { errorHandler } from './lib/http.js';
import { uploadsDir } from './middleware/upload.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.use(cors({ origin: config.clientUrl.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Datos públicos de la tienda que el frontend necesita (envío gratis, modo de pago...).
  app.get('/api/config', (_req, res) =>
    res.json({
      storeName: config.store.name,
      whatsapp: config.store.whatsapp,
      freeShippingFrom: config.store.freeShippingFrom,
      shippingFlat: config.store.shippingFlat,
      paymentMode: mpEnabled ? 'mercadopago' : 'simulated',
    }),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // En producción, el mismo servidor puede entregar el frontend ya compilado.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dist = path.join(here, '..', '..', 'client', 'dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
