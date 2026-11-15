import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useHooks.js';

const tab = ({ isActive }) =>
  `rounded-full px-4 py-2 font-semibold transition-colors ${isActive ? 'bg-ink text-bg' : 'hover:bg-sunk'}`;

export default function AdminLayout() {
  const { isAdmin, email, logout } = useAuth();
  useDocumentTitle('Panel de administración');
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold" style={{ fontStretch: '85%' }}>Panel de la tienda</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted sm:inline">{email}</span>
          <Link to="/" className="btn btn-ghost min-h-10">Ver la tienda</Link>
          <button type="button" onClick={logout} className="btn btn-ghost min-h-10">Cerrar sesión</button>
        </div>
      </div>
      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line pb-3" aria-label="Administración">
        <NavLink to="/admin" end className={tab}>Resumen</NavLink>
        <NavLink to="/admin/productos" className={tab}>Productos</NavLink>
        <NavLink to="/admin/pedidos" className={tab}>Pedidos</NavLink>
      </nav>
      <div className="mt-8"><Outlet /></div>
    </div>
  );
}
