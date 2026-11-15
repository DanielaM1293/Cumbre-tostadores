import { Link } from 'react-router-dom';
import { ErrorState, Skeleton } from '../../components/Bits.jsx';
import { useFetch } from '../../hooks/useHooks.js';
import { formatCOP } from '../../lib/format.js';

export default function Dashboard() {
  const { data, error, refetch } = useFetch('/orders/admin/stats');
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;

  const stats = [
    ['Pedidos', data.orders.toLocaleString('es-CO')],
    ['Ventas (sin cancelados)', formatCOP(data.revenue)],
    ['Pedidos pendientes', data.pending.toLocaleString('es-CO')],
  ];

  return (
    <div className="space-y-12">
      <dl className="grid divide-y divide-line rounded-3xl bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map(([label, value]) => (
          <div key={label} className="p-6">
            <dt className="text-muted">{label}</dt>
            <dd className="tabnum mt-1 font-display text-4xl font-extrabold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="low">
          <h2 id="low" className="text-2xl font-bold">Stock bajo</h2>
          {data.lowStock.length === 0 ? <p className="mt-3 text-muted">Todo tiene stock suficiente.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <Link to="/admin/productos" className="font-medium hover:underline">{p.name}</Link>
                  <span className={`tabnum font-semibold ${p.stock === 0 ? 'text-cherry' : ''}`}>{p.stock === 0 ? 'Agotado' : `${p.stock} und.`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="top">
          <h2 id="top" className="text-2xl font-bold">Lo más pedido</h2>
          {data.top.length === 0 ? <p className="mt-3 text-muted">Cuando lleguen pedidos, aquí verás los favoritos.</p> : (
            <ol className="mt-3 divide-y divide-line">
              {data.top.map((p) => (
                <li key={p.name} className="flex items-center justify-between py-3">
                  <span className="font-medium">{p.name}</span>
                  <span className="tabnum text-muted">{p.units} und.</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
