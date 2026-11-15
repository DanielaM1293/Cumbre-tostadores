import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState, Skeleton } from '../components/Bits.jsx';
import { useDocumentTitle, useFetch } from '../hooks/useHooks.js';
import { ApiError, api } from '../lib/api.js';
import { formatCOP } from '../lib/format.js';

// Pantalla que imita una pasarela. Solo existe mientras el servidor no tenga credenciales de Mercado Pago.
export default function SimulatedPay() {
  useDocumentTitle('Pago de prueba');
  const { id } = useParams();
  const token = useSearchParams()[0].get('token') || '';
  const navigate = useNavigate();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const { data, error: loadError, refetch } = useFetch(`/orders/${id}/public?token=${encodeURIComponent(token)}`, { enabled: Boolean(token) });

  const pay = async (result) => {
    setBusy(result);
    setError('');
    try {
      await new Promise((r) => setTimeout(r, 900)); // simula el tiempo de respuesta del banco
      await api(`/payments/simulate/${id}`, { method: 'POST', auth: false, body: { token, result } });
      navigate(`/pedido/${id}?token=${token}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos procesar el pago de prueba.');
      setBusy('');
    }
  };

  if (!token || loadError?.status === 404) return <div className="mx-auto max-w-md px-4 py-24 text-center"><h1 className="text-3xl font-extrabold">Pedido no encontrado</h1></div>;
  if (loadError) return <div className="mx-auto max-w-md px-4 py-20"><ErrorState error={loadError} onRetry={refetch} /></div>;
  const order = data?.order;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-line bg-surface p-7">
        <p className="rounded-full bg-roast/25 px-3 py-1 text-center text-sm font-semibold">Pasarela de demostración. No se cobra dinero real.</p>
        {!order ? <Skeleton className="mt-6 h-32" /> : (
          <>
            <h1 className="mt-6 text-3xl font-extrabold">Pagar {formatCOP(order.total)}</h1>
            <p className="mt-1 text-muted">Pedido {order.code} en Cumbre Tostadores</p>
            <div className="mt-6 space-y-3" aria-hidden="true">
              <div className="field flex items-center text-muted">4242 4242 4242 4242</div>
              <div className="grid grid-cols-2 gap-3"><div className="field flex items-center text-muted">12 / 30</div><div className="field flex items-center text-muted">123</div></div>
            </div>
            {error && <p role="alert" className="mt-4 text-sm font-medium text-cherry">{error}</p>}
            <button type="button" className="btn btn-primary mt-6 w-full" disabled={Boolean(busy)} onClick={() => pay('approved')}>
              {busy === 'approved' ? 'Procesando el pago…' : 'Aprobar el pago'}
            </button>
            <button type="button" className="btn btn-ghost mt-3 w-full" disabled={Boolean(busy)} onClick={() => pay('rejected')}>
              {busy === 'rejected' ? 'Procesando…' : 'Simular un pago rechazado'}
            </button>
            <p className="mt-4 text-center text-sm text-muted">Con tus credenciales de Mercado Pago en el servidor, esta pantalla se reemplaza por su checkout real.</p>
          </>
        )}
      </div>
    </div>
  );
}
