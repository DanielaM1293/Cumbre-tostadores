import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { config, mpEnabled } from '../config.js';
import { HttpError, parse } from '../lib/http.js';
import { getOrder, getOrderToken } from '../lib/mappers.js';

const router = Router();
const MP_API = 'https://api.mercadopago.com';

const tokenMatches = (orderId, token) => {
  const real = getOrderToken(orderId);
  const given = String(token || '');
  return Boolean(real) && given.length === real.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(real));
};

async function mp(path, options = {}) {
  const res = await fetch(`${MP_API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${config.mercadoPagoToken}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Mercado Pago error', res.status, data);
    throw new HttpError(502, 'No pudimos iniciar el pago con Mercado Pago. Intenta de nuevo o pide por WhatsApp.');
  }
  return data;
}

const createBody = z.object({ orderId: z.coerce.number().int().min(1), token: z.string().min(10) });

// Paso 1: el cliente ya creó el pedido; aquí pedimos la URL de pago.
router.post('/create', async (req, res) => {
  const { orderId, token } = parse(createBody, req.body);
  if (!tokenMatches(orderId, token)) throw new HttpError(404, 'No encontramos ese pedido.');

  const order = getOrder(orderId);
  if (order.paymentStatus === 'paid') throw new HttpError(409, 'Este pedido ya está pagado.');
  if (order.status === 'cancelled') throw new HttpError(409, 'Este pedido fue cancelado.');

  // Sin credenciales: modo demo con una pantalla de pago simulada.
  if (!mpEnabled) {
    return res.json({ mode: 'simulated', url: `${config.clientUrl}/pago-simulado/${orderId}?token=${token}` });
  }

  const items = order.items.map((i) => ({
    title: i.name, quantity: i.quantity, unit_price: i.unitPrice, currency_id: 'COP',
  }));
  if (order.shipping > 0) items.push({ title: 'Envío', quantity: 1, unit_price: order.shipping, currency_id: 'COP' });

  const back = `${config.clientUrl}/pedido/${orderId}?token=${token}`;
  const body = {
    items,
    external_reference: String(orderId),
    payer: { name: order.customer.name },
    back_urls: { success: back, failure: back, pending: back },
    // Mercado Pago solo acepta auto_return con URLs https.
    ...(config.clientUrl.startsWith('https') ? { auto_return: 'approved' } : {}),
    ...(config.publicApiUrl ? { notification_url: `${config.publicApiUrl}/api/payments/webhook` } : {}),
  };

  const pref = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify(body) });
  const sandbox = config.mercadoPagoToken.startsWith('TEST-');
  res.json({ mode: 'mercadopago', url: sandbox ? pref.sandbox_init_point : pref.init_point });
});

// Pantalla de pago simulado (solo cuando no hay credenciales reales).
router.post('/simulate/:orderId', (req, res) => {
  if (mpEnabled) throw new HttpError(404, 'No encontrado.');
  const orderId = parse(z.coerce.number().int().min(1), req.params.orderId);
  const { token, result } = parse(
    z.object({ token: z.string().min(10), result: z.enum(['approved', 'rejected']) }),
    req.body,
  );
  if (!tokenMatches(orderId, token)) throw new HttpError(404, 'No encontramos ese pedido.');

  const order = getOrder(orderId);
  if (order.status === 'cancelled') throw new HttpError(409, 'Este pedido fue cancelado.');
  if (order.paymentStatus === 'paid') return res.json({ order });

  if (result === 'approved') {
    db.prepare("UPDATE orders SET payment_status = 'paid', status = 'paid', payment_ref = 'SIMULADO' WHERE id = ?").run(orderId);
  } else {
    db.prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?").run(orderId);
  }
  res.json({ order: getOrder(orderId) });
});

// Paso 2: Mercado Pago avisa. No confiamos en el cuerpo: consultamos el pago directamente a su API.
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responder rápido; MP reintenta si no recibe 200
  if (!mpEnabled) return;

  const type = req.body?.type || req.query.type || req.query.topic;
  const paymentId = req.body?.data?.id || req.query['data.id'] || req.query.id;
  if (type !== 'payment' || !paymentId) return;

  try {
    const payment = await mp(`/v1/payments/${encodeURIComponent(paymentId)}`);
    const orderId = Number(payment.external_reference);
    const order = orderId ? getOrder(orderId) : null;
    if (!order) return;

    if (payment.status === 'approved' && order.paymentStatus !== 'paid' && order.status !== 'cancelled') {
      db.prepare("UPDATE orders SET payment_status = 'paid', status = 'paid', payment_ref = ? WHERE id = ?")
        .run(String(paymentId), orderId);
    } else if (['rejected', 'cancelled'].includes(payment.status) && order.paymentStatus === 'unpaid') {
      db.prepare("UPDATE orders SET payment_status = 'failed', payment_ref = ? WHERE id = ?").run(String(paymentId), orderId);
    }
  } catch (err) {
    console.error('Webhook de pago falló:', err.message);
  }
});

export default router;
