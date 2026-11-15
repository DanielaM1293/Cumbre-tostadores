import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../lib/http.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(here, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, 'Sube una imagen JPG, PNG o WebP.'));
  },
});
