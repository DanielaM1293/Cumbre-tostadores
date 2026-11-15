import { db } from '../db.js';
import { config } from '../config.js';

export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    origin: row.origin,
    altitude: row.altitude,
    roast: row.roast,
    notes: row.notes ? row.notes.split(',').filter(Boolean) : [],
    weightG: row.weight_g,
    stock: row.stock,
    active: Boolean(row.active),
    imageUrl: row.image_url,
    color: row.color,
    createdAt: row.created_at,
  };
}

export const orderCode = (id) => `CMB-${1000 + id}`;

export function formatCOP(n) {
  return `$${Number(n).toLocaleString('es-CO')}`;
}

export function buildWhatsAppMessage(order) {
  const lines = order.items.map((i) => `• ${i.quantity} × ${i.name} — ${formatCOP(i.unitPrice * i.quantity)}`);
  const text = [
    `Hola ${config.store.name} ☕ Quiero confirmar mi pedido ${order.code}:`,
    '',
    ...lines,
    '',
    `Subtotal: ${formatCOP(order.subtotal)}`,
    `Envío: ${order.shipping === 0 ? 'gratis' : formatCOP(order.shipping)}`,
    `*Total: ${formatCOP(order.total)}*`,
    '',
    `Nombre: ${order.customer.name}`,
    `Teléfono: ${order.customer.phone}`,
    `Dirección: ${order.customer.address}, ${order.customer.city}`,
    order.customer.notes ? `Notas: ${order.customer.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');
  return `https://wa.me/${config.store.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Devuelve el pedido completo (sin token) con sus ítems.
export function getOrder(id) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!row) return null;
  const items = db
    .prepare('SELECT product_id, name, unit_price, quantity FROM order_items WHERE order_id = ? ORDER BY id')
    .all(id)
    .map((i) => ({ productId: i.product_id, name: i.name, unitPrice: i.unit_price, quantity: i.quantity }));

  const order = {
    id: row.id,
    code: orderCode(row.id),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    createdAt: row.created_at,
    customer: { name: row.customer_name, phone: row.phone, address: row.address, city: row.city, notes: row.notes },
    items,
  };
  return order;
}

export function getOrderToken(id) {
  return db.prepare('SELECT public_token FROM orders WHERE id = ?').get(id)?.public_token ?? null;
}
