import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { db, transaction } from './db.js';
import { config } from './config.js';
import { products } from './seedData.js';

export function ensureAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(config.admin.email);
  if (existing) return;
  const hash = bcrypt.hashSync(config.admin.password, 10);
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(config.admin.email, hash);
}

export function seedProducts({ force = false } = {}) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count > 0 && !force) return false;

  const insert = db.prepare(`
    INSERT INTO products
      (name, description, price, category, origin, altitude, roast, notes, weight_g, stock, active, image_url, color)
    VALUES
      (@name, @description, @price, @category, @origin, @altitude, @roast, @notes, @weightG, @stock, 1, '', @color)
  `);

  transaction(() => {
    if (force) db.prepare('DELETE FROM products').run();
    for (const p of products) insert.run({ ...p, notes: p.notes.join(',') });
  })();
  return true;
}

export function seedAll() {
  ensureAdmin();
  return seedProducts();
}

// `npm run seed` reinicia el catálogo con los datos de ejemplo.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureAdmin();
  seedProducts({ force: true });
  console.log(`✔ Catálogo cargado (${products.length} productos) y admin ${config.admin.email} listo.`);
}
