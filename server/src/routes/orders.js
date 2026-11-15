import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db, transaction } from '../db.js';
import { config } from '../config.js';
import { HttpError, parse } from '../lib/http.js';
import { buildWhatsAppMessage, getOrder, getOrderToken } from '../lib/mappers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const orderBody = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Escribe tu nombre.').max(80),
    phone: z.string().trim().regex(/^\+?[0-9\s-]{7,16}$/, 'Escribe un celular válido, por ejemplo 300 123 4567.'),
    address: z.string().trim().min(5, 'Escribe tu dirección completa.').max(160),
    city: z.string().trim().min(2, 'Escribe tu ciudad.').max(60),
    notes: z.string().trim().max(300).default(''),
  }),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().min(1),
        qty: z.coerce.number().int().min(1, 'La cantidad mínima es 1.').max(20, 'Máximo 20 unidades por producto.'),
      }),
    )
    .min(1, 'Tu carrito está vacío.')
    .max(30),
  paymentMethod: z.enum(['whatsapp', 'online']),
});

export function calcShipping(subtotal) {
  return subtotal >= config.store.freeShippingFrom ? 0 : config.store.shippingFlat;
}

// Crea el pedido recalculando todo con los precios de la base de datos: el cliente nunca decide el total.
const createOrder = transaction((input) => {
  // Une líneas repetidas del mismo producto.
  const wanted = new Map();
  for (const { productId, qty } of input.items) wanted.set(productId, (wanted.get(productId) ?? 0) + qty);

  const lines = [];
  for (const [productId, qty] of wanted) {
    const p = db.prepare('SELECT id, name, price, stock, active FROM products WHERE id = ?').get(productId);
    if (!p || !p.active) throw new HttpError(409, 'Uno de los productos ya no está disponible. Revisa tu carrito.', { productId });
    if (p.stock < qty) {
      const left = p.stock === 0 ? 'está agotado' : `solo tiene ${p.stock} ${p.stock === 1 ? 'unidad' : 'unidades'}`;
      throw new HttpError(409, `${p.name} ${left}.`, { productId, available: p.stock });
    }
    lines.push({ ...p, qty });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = calcShipping(subtotal);
  const total = subtotal + shipping;
  const { customer } = input;

  const { lastInsertRowid } = db
    .prepare(`INSERT INTO orders (public_token, customer_name, phone, address, city, notes, subtotal, shipping, total, payment_method)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(crypto.randomBytes(16).toString('hex'), customer.name, customer.phone, customer.address, customer.city,
         customer.notes, subtotal, shipping, total, input.paymentMethod);

  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)');
  const decrement = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const l of lines) {
    insertItem.run(lastInsertRowid, l.id, l.name, l.price, l.qty);
    decrement.run(l.qty, l.id);
  }
  return Number(lastInsertRowid);
});

router.post('/', (req, res) => {
  const input = parse(orderBody, req.body);
  const id = createOrder(input);
  const order = getOrder(id);
  res.status(201).json({
    order,
    token: getOrderToken(id),
    whatsappUrl: input.paymentMethod === 'whatsapp' ? buildWhatsAppMessage(order) : null,
  });
});

// Seguimiento público: solo con el token que recibió quien hizo el pedido.
router.get('/:id/public', (req, res) => {
  const id = parse(z.coerce.number().int().min(1), req.params.id);
  const token = String(req.query.token || '');
  const real = getOrderToken(id);
  if (!real || token.length !== real.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(real))) {
    throw new HttpError(404, 'No encontramos ese pedido.');
  }
  const order = getOrder(id);
  res.json({
    order,
    whatsappUrl: order.paymentMethod === 'whatsapp' ? buildWhatsAppMessage(order) : null,
  });
});

// ---------- Panel admin ----------

const STATUSES = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'];

router.get('/', requireAuth, (req, res) => {
  const status = STATUSES.includes(req.query.status) ? req.query.status : null;
  const rows = status
    ? db.prepare('SELECT id FROM orders WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT id FROM orders ORDER BY id DESC').all();
  res.json({ items: rows.map((r) => getOrder(r.id)) });
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const id = parse(z.coerce.number().int().min(1), req.params.id);
  const { status } = parse(z.object({ status: z.enum(STATUSES) }), req.body);

  transaction(() => {
    const current = db.prepare('SELECT status FROM orders WHERE id = ?').get(id);
    if (!current) throw new HttpError(404, 'No encontramos ese pedido.');
    if (current.status === status) return;
    if (current.status === 'cancelled') {
      throw new HttpError(409, 'Un pedido cancelado no se puede reactivar. Crea uno nuevo.');
    }
    if (status === 'cancelled') {
      // Devuelve el stock reservado al cancelar.
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(id);
      const restore = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const i of items) if (i.product_id) restore.run(i.quantity, i.product_id);
    }
    const paid = status === 'paid' ? ", payment_status = 'paid'" : '';
    db.prepare(`UPDATE orders SET status = ?${paid} WHERE id = ?`).run(status, id);
  })();

  res.json(getOrder(id));
});

router.get('/admin/stats', requireAuth, (_req, res) => {
  const totals = db
    .prepare(`SELECT COUNT(*) AS orders,
                     COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0) AS revenue,
                     COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 END), 0) AS pending
              FROM orders`)
    .get();
  const lowStock = db
    .prepare('SELECT id, name, stock FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock, name LIMIT 8')
    .all();
  const top = db
    .prepare(`SELECT oi.name, SUM(oi.quantity) AS units
              FROM order_items oi JOIN orders o ON o.id = oi.order_id
              WHERE o.status != 'cancelled' GROUP BY oi.name ORDER BY units DESC LIMIT 5`)
    .all();
  res.json({ ...totals, lowStock, top });
});

export default router;
