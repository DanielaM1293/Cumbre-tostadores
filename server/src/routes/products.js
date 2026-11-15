import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { HttpError, parse } from '../lib/http.js';
import { mapProduct } from '../lib/mappers.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const int = (min, max) => z.coerce.number().int().min(min).max(max);

const listQuery = z.object({
  category: z.string().trim().optional(),
  q: z.string().trim().max(60).optional(),
  min: int(0, 1e9).optional(),
  max: int(0, 1e9).optional(),
  roastMin: int(1, 5).optional(),
  roastMax: int(1, 5).optional(),
  inStock: z.enum(['1']).optional(),
  all: z.enum(['1']).optional(), // admin: incluye productos inactivos
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name', 'roast']).default('newest'),
});

const SORTS = {
  newest: 'id DESC',
  price_asc: 'price ASC, id DESC',
  price_desc: 'price DESC, id DESC',
  name: 'name COLLATE NOCASE ASC',
  roast: 'roast IS NULL, roast ASC, name ASC',
};

router.get('/', optionalAuth, (req, res) => {
  const f = parse(listQuery, req.query);
  const showAll = f.all && req.user;

  const where = [];
  const params = {};
  if (!showAll) where.push('active = 1');
  if (f.category) { where.push('category = @category'); params.category = f.category; }
  if (f.q) {
    where.push('(name LIKE @q OR origin LIKE @q OR notes LIKE @q OR description LIKE @q)');
    params.q = `%${f.q}%`;
  }
  if (f.min !== undefined) { where.push('price >= @min'); params.min = f.min; }
  if (f.max !== undefined) { where.push('price <= @max'); params.max = f.max; }
  if (f.roastMin !== undefined) { where.push('roast >= @roastMin'); params.roastMin = f.roastMin; }
  if (f.roastMax !== undefined) { where.push('roast <= @roastMax'); params.roastMax = f.roastMax; }
  if (f.inStock) where.push('stock > 0');

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const items = db
    .prepare(`SELECT * FROM products ${clause} ORDER BY ${SORTS[f.sort]}`)
    .all(params)
    .map(mapProduct);

  // Facetas calculadas sobre todo el catálogo visible, para que los filtros siempre muestren opciones reales.
  const base = showAll ? '' : 'WHERE active = 1';
  const categories = db
    .prepare(`SELECT category AS name, COUNT(*) AS count FROM products ${base} GROUP BY category ORDER BY count DESC, name`)
    .all();
  const range = db.prepare(`SELECT MIN(price) AS min, MAX(price) AS max FROM products ${base}`).get();

  // Cuántos productos hay en cada nivel de tueste (alimenta el selector del hero).
  const roasts = db
    .prepare(`SELECT roast, COUNT(*) AS count FROM products WHERE roast IS NOT NULL ${showAll ? '' : 'AND active = 1'} GROUP BY roast ORDER BY roast`)
    .all();

  res.json({ items, total: items.length, categories, roasts, priceRange: { min: range.min ?? 0, max: range.max ?? 0 } });
});

router.get('/:id', optionalAuth, (req, res) => {
  const id = parse(int(1, 1e9), req.params.id);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!row || (!row.active && !req.user)) throw new HttpError(404, 'No encontramos ese producto.');

  const related = db
    .prepare('SELECT * FROM products WHERE active = 1 AND id != ? AND category = ? ORDER BY ABS(IFNULL(roast,3) - ?) , id DESC LIMIT 4')
    .all(id, row.category, row.roast ?? 3)
    .map(mapProduct);

  res.json({ ...mapProduct(row), related });
});

const productBody = z.object({
  name: z.string().trim().min(2, 'El nombre necesita al menos 2 letras.').max(80),
  description: z.string().trim().max(1000).default(''),
  price: z.coerce.number('Escribe un precio.').int().min(0, 'El precio no puede ser negativo.').max(100_000_000),
  category: z.string().trim().min(2, 'Elige o escribe una categoría.').max(40),
  origin: z.string().trim().max(80).default(''),
  altitude: z.coerce.number().int().min(0).max(5000).nullish(),
  roast: z.coerce.number().int().min(1).max(5).nullish(),
  notes: z.array(z.string().trim().min(1).max(30)).max(6).default([]),
  weightG: z.coerce.number().int().min(0).max(100000).nullish(),
  stock: z.coerce.number('Escribe el stock.').int().min(0, 'El stock no puede ser negativo.').max(100000),
  active: z.boolean().default(true),
  imageUrl: z.string().trim().max(300).default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa un color hexadecimal, por ejemplo #8a5a3c.').default('#8a5a3c'),
});

const toRow = (p) => ({
  name: p.name, description: p.description, price: p.price, category: p.category, origin: p.origin,
  altitude: p.altitude ?? null, roast: p.roast ?? null, notes: p.notes.join(','), weightG: p.weightG ?? null,
  stock: p.stock, active: p.active ? 1 : 0, imageUrl: p.imageUrl, color: p.color,
});

router.post('/', requireAuth, (req, res) => {
  const row = toRow(parse(productBody, req.body));
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO products (name, description, price, category, origin, altitude, roast, notes, weight_g, stock, active, image_url, color)
              VALUES (@name, @description, @price, @category, @origin, @altitude, @roast, @notes, @weightG, @stock, @active, @imageUrl, @color)`)
    .run(row);
  res.status(201).json(mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(lastInsertRowid)));
});

router.put('/:id', requireAuth, (req, res) => {
  const id = parse(int(1, 1e9), req.params.id);
  const row = toRow(parse(productBody, req.body));
  const { changes } = db
    .prepare(`UPDATE products SET name=@name, description=@description, price=@price, category=@category, origin=@origin,
              altitude=@altitude, roast=@roast, notes=@notes, weight_g=@weightG, stock=@stock, active=@active,
              image_url=@imageUrl, color=@color WHERE id=@id`)
    .run({ ...row, id });
  if (!changes) throw new HttpError(404, 'No encontramos ese producto.');
  res.json(mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)));
});

// Cambios rápidos desde la tabla del panel (activar/desactivar y ajustar stock).
const patchBody = z.object({
  active: z.boolean().optional(),
  stock: z.coerce.number().int().min(0).max(100000).optional(),
});

router.patch('/:id', requireAuth, (req, res) => {
  const id = parse(int(1, 1e9), req.params.id);
  const patch = parse(patchBody, req.body);
  const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!current) throw new HttpError(404, 'No encontramos ese producto.');
  db.prepare('UPDATE products SET active = ?, stock = ? WHERE id = ?').run(
    patch.active === undefined ? current.active : patch.active ? 1 : 0,
    patch.stock ?? current.stock,
    id,
  );
  res.json(mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)));
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = parse(int(1, 1e9), req.params.id);
  const { changes } = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (!changes) throw new HttpError(404, 'No encontramos ese producto.');
  res.status(204).end();
});

router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Selecciona una imagen para subir.');
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
});

export default router;
