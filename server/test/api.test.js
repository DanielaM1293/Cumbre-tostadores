import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cumbre-test-'));
process.env.DB_FILE = path.join(dir, 'test.db');
process.env.ADMIN_EMAIL = 'admin@test.co';
process.env.ADMIN_PASSWORD = 'secreto123';
process.env.MP_ACCESS_TOKEN = '';

let server, base, adminToken;

const api = async (url, { method = 'GET', body, token } = {}) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
};

const customer = { name: 'Camila Ruiz', phone: '300 123 4567', address: 'Cra 7 # 45-10', city: 'Bogotá' };

before(async () => {
  const { seedAll } = await import('../src/seed.js');
  const { createApp } = await import('../src/app.js');
  seedAll();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  adminToken = (await api('/api/auth/login', { method: 'POST', body: { email: 'admin@test.co', password: 'secreto123' } })).data.token;
});

after(() => {
  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('catálogo filtra por categoría, precio y tueste', async () => {
  const all = await api('/api/products');
  assert.equal(all.status, 200);
  assert.ok(all.data.items.length >= 10);
  assert.ok(all.data.categories.some((c) => c.name === 'Café en grano'));

  const cheap = await api('/api/products?category=Accesorios&max=80000&sort=price_asc');
  assert.ok(cheap.data.items.every((p) => p.category === 'Accesorios' && p.price <= 80000));
  const prices = cheap.data.items.map((p) => p.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

  const dark = await api('/api/products?roastMin=4&roastMax=5');
  assert.ok(dark.data.items.length > 0 && dark.data.items.every((p) => p.roast >= 4));

  const search = await api('/api/products?q=panela');
  assert.ok(search.data.items.some((p) => p.name === 'Mirador'));
});

test('rutas de admin exigen sesión y el login rechaza claves malas', async () => {
  assert.equal((await api('/api/products', { method: 'POST', body: { name: 'x' } })).status, 401);
  assert.equal((await api('/api/orders')).status, 401);
  assert.equal((await api('/api/auth/login', { method: 'POST', body: { email: 'admin@test.co', password: 'mal' } })).status, 401);
});

test('admin crea, edita, oculta y borra un producto', async () => {
  const body = { name: 'Lote de prueba', price: 50000, category: 'Café en grano', stock: 5, notes: ['miel'], roast: 3 };
  const created = await api('/api/products', { method: 'POST', body, token: adminToken });
  assert.equal(created.status, 201);
  const id = created.data.id;

  const bad = await api('/api/products', { method: 'POST', body: { ...body, price: -1 }, token: adminToken });
  assert.equal(bad.status, 400);
  assert.ok(bad.data.fields.some((f) => f.field === 'price'));

  const updated = await api(`/api/products/${id}`, { method: 'PUT', body: { ...body, price: 55000 }, token: adminToken });
  assert.equal(updated.data.price, 55000);

  await api(`/api/products/${id}`, { method: 'PATCH', body: { active: false }, token: adminToken });
  assert.equal((await api(`/api/products/${id}`)).status, 404); // el público ya no lo ve
  assert.equal((await api(`/api/products/${id}`, { token: adminToken })).status, 200);

  assert.equal((await api(`/api/products/${id}`, { method: 'DELETE', token: adminToken })).status, 204);
});

test('el servidor ignora precios del cliente y descuenta stock', async () => {
  const mirador = (await api('/api/products?q=Mirador')).data.items[0];
  const res = await api('/api/orders', {
    method: 'POST',
    body: { customer, paymentMethod: 'whatsapp', items: [{ productId: mirador.id, qty: 2, price: 1 }] },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.order.subtotal, mirador.price * 2);
  assert.equal(res.data.order.shipping, 9000);
  assert.equal(res.data.order.total, mirador.price * 2 + 9000);
  assert.match(res.data.whatsappUrl, /^https:\/\/wa\.me\/\d+\?text=/);

  const after = (await api(`/api/products/${mirador.id}`)).data;
  assert.equal(after.stock, mirador.stock - 2);
});

test('envío gratis desde el umbral', async () => {
  const molinillo = (await api('/api/products?q=Molinillo')).data.items[0];
  const res = await api('/api/orders', {
    method: 'POST',
    body: { customer, paymentMethod: 'online', items: [{ productId: molinillo.id, qty: 2 }] },
  });
  assert.equal(res.data.order.shipping, 0);
  assert.equal(res.data.order.total, molinillo.price * 2);
});

test('rechaza stock insuficiente y productos agotados con un mensaje claro', async () => {
  const taza = (await api('/api/products?q=Taza')).data.items[0];
  assert.equal(taza.stock, 0);
  const res = await api('/api/orders', {
    method: 'POST',
    body: { customer, paymentMethod: 'whatsapp', items: [{ productId: taza.id, qty: 1 }] },
  });
  assert.equal(res.status, 409);
  assert.match(res.data.error, /agotado/);
});

test('si una línea del pedido falla, no se descuenta nada (transacción)', async () => {
  const canon = (await api('/api/products?q=Cañón')).data.items[0];
  const taza = (await api('/api/products?q=Taza')).data.items[0]; // agotada
  const res = await api('/api/orders', {
    method: 'POST',
    body: { customer, paymentMethod: 'whatsapp', items: [{ productId: canon.id, qty: 1 }, { productId: taza.id, qty: 1 }] },
  });
  assert.equal(res.status, 409);
  assert.equal((await api(`/api/products/${canon.id}`)).data.stock, canon.stock);
  const orders = (await api('/api/orders', { token: adminToken })).data.items;
  assert.ok(orders.every((o) => o.items.length > 0 && o.customer.name));
});

test('valida los datos del cliente', async () => {
  const res = await api('/api/orders', {
    method: 'POST',
    body: { customer: { ...customer, phone: 'abc' }, paymentMethod: 'whatsapp', items: [{ productId: 1, qty: 1 }] },
  });
  assert.equal(res.status, 400);
  assert.ok(res.data.fields.some((f) => f.field === 'customer.phone'));
});

test('pago simulado marca el pedido como pagado y exige el token', async () => {
  const prod = (await api('/api/products?q=Cañón')).data.items[0];
  const { data } = await api('/api/orders', {
    method: 'POST',
    body: { customer, paymentMethod: 'online', items: [{ productId: prod.id, qty: 1 }] },
  });
  const { id } = data.order;

  const pay = await api('/api/payments/create', { method: 'POST', body: { orderId: id, token: data.token } });
  assert.equal(pay.data.mode, 'simulated');
  assert.equal((await api('/api/payments/create', { method: 'POST', body: { orderId: id, token: 'x'.repeat(32) } })).status, 404);

  assert.equal((await api(`/api/orders/${id}/public?token=${'0'.repeat(32)}`)).status, 404);

  const ok = await api(`/api/payments/simulate/${id}`, { method: 'POST', body: { token: data.token, result: 'approved' } });
  assert.equal(ok.data.order.paymentStatus, 'paid');
  assert.equal((await api(`/api/orders/${id}/public?token=${data.token}`)).data.order.status, 'paid');
});

test('cancelar un pedido devuelve el stock', async () => {
  const prod = (await api('/api/products?q=Suroeste')).data.items[0];
  const { data } = await api('/api/orders', {
    method: 'POST',
    body: { customer, paymentMethod: 'whatsapp', items: [{ productId: prod.id, qty: 3 }] },
  });
  assert.equal((await api(`/api/products/${prod.id}`)).data.stock, prod.stock - 3);

  const cancelled = await api(`/api/orders/${data.order.id}/status`, { method: 'PATCH', body: { status: 'cancelled' }, token: adminToken });
  assert.equal(cancelled.data.status, 'cancelled');
  assert.equal((await api(`/api/products/${prod.id}`)).data.stock, prod.stock);

  const reopen = await api(`/api/orders/${data.order.id}/status`, { method: 'PATCH', body: { status: 'paid' }, token: adminToken });
  assert.equal(reopen.status, 409);
});

test('estadísticas del panel', async () => {
  const stats = await api('/api/orders/admin/stats', { token: adminToken });
  assert.equal(stats.status, 200);
  assert.ok(stats.data.orders >= 4);
  assert.ok(Array.isArray(stats.data.lowStock));
});
