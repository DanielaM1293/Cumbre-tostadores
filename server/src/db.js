// SQLite integrado en Node (22.13 o superior): no hay nada nativo que compilar al instalar.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(process.env.DB_FILE || path.join(dataDir, 'tienda.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// Ejecuta `fn` dentro de una transacción: si lanza un error, se deshace todo (precios, stock y pedido juntos).
export function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price       INTEGER NOT NULL CHECK (price >= 0),
    category    TEXT NOT NULL,
    origin      TEXT NOT NULL DEFAULT '',
    altitude    INTEGER,
    roast       INTEGER CHECK (roast BETWEEN 1 AND 5),
    notes       TEXT NOT NULL DEFAULT '',
    weight_g    INTEGER,
    stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active      INTEGER NOT NULL DEFAULT 1,
    image_url   TEXT NOT NULL DEFAULT '',
    color       TEXT NOT NULL DEFAULT '#8a5a3c',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    public_token   TEXT NOT NULL,
    customer_name  TEXT NOT NULL,
    phone          TEXT NOT NULL,
    address        TEXT NOT NULL,
    city           TEXT NOT NULL,
    notes          TEXT NOT NULL DEFAULT '',
    subtotal       INTEGER NOT NULL,
    shipping       INTEGER NOT NULL,
    total          INTEGER NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    payment_ref    TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity   INTEGER NOT NULL CHECK (quantity > 0)
  );
`);
