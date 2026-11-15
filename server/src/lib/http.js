import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Convierte un esquema de Zod en una respuesta 400 legible para el formulario.
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) throw result.error;
  return result.data;
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Revisa los datos enviados.',
      fields: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'La imagen supera los 2 MB.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Algo salió mal en el servidor. Intenta de nuevo.' });
}
