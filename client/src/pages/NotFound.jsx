import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useHooks.js';

export default function NotFound() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <h1 className="text-5xl font-extrabold" style={{ fontStretch: '80%' }}>Esta página no existe</h1>
      <p className="mt-4 text-muted">El enlace puede estar mal escrito o la página ya no está disponible.</p>
      <Link to="/" className="btn btn-dark mt-8">Volver a la tienda</Link>
    </div>
  );
}
