import { useState } from 'react';
import { Badge, ErrorState, Skeleton } from '../../components/Bits.jsx';
import { ChevronIcon, WhatsAppIcon } from '../../components/Icons.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useFetch } from '../../hooks/useHooks.js';
import { api } from '../../lib/api.js';
import { STATUS_LABEL, formatCOP, formatDate, whatsappLink } from '../../lib/format.js';

const TONE = { pending: 'warn', paid: 'good', preparing: 'good', shipped: 'good', delivered: 'good', cancelled: 'bad' };

export default function Orders() {
  const [status, setStatus] = useState('');
  const { data, error, refetch } = useFetch(`/orders${status ? `?status=${status}` : ''}`);
  const { toast } = useUI();

  const update = async (order, next) => {
    if (next === 'cancelled' && !window.confirm(`¿Cancelar el pedido ${order.code}? Se devolverá el stock y no se puede deshacer.`)) return;
    try {
      await api(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: next } });
      toast(`${order.code} ahora está ${STATUS_LABEL[next].toLowerCase()}.`);
      refetch();
    } catch (err) {
      toast(err.message);
      refetch();
    }
  };

  if (error && !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        <button type="button" className="chip" aria-pressed={!status} onClick={() => setStatus('')}>Todos</button>
        {Object.entries(STATUS_LABEL).map(([k, l]) => (
          <button key={k} type="button" className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>
        ))}
      </div>

      {!data ? <Skeleton className="mt-6 h-64" /> : data.items.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center text-muted">
          {status ? 'No hay pedidos con ese estado.' : 'Todavía no hay pedidos. Cuando alguien compre, aparecerá aquí.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.items.map((o) => (
            <li key={o.id} className="rounded-3xl bg-surface">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2 p-5 [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-xl font-extrabold">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{o.customer.name}</span>
                  <span className="text-sm text-muted">{formatDate(o.createdAt)}</span>
                  <Badge tone={TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  <span className="tabnum font-bold">{formatCOP(o.total)}</span>
                  <ChevronIcon className="transition-transform group-open:rotate-180" />
                </summary>

                <div className="grid gap-6 border-t border-line p-5 md:grid-cols-2">
                  <div>
                    <ul className="divide-y divide-line">
                      {o.items.map((i) => (
                        <li key={i.name} className="flex justify-between gap-3 py-2"><span>{i.quantity} × {i.name}</span><span className="tabnum">{formatCOP(i.unitPrice * i.quantity)}</span></li>
                      ))}
                    </ul>
                    <p className="tabnum mt-2 flex justify-between text-sm text-muted"><span>Envío</span><span>{o.shipping === 0 ? 'Gratis' : formatCOP(o.shipping)}</span></p>
                  </div>
                  <div className="space-y-3">
                    <p>{o.customer.address}, {o.customer.city}</p>
                    {o.customer.notes && <p className="text-muted">Nota: {o.customer.notes}</p>}
                    <p className="flex flex-wrap gap-2">
                      <Badge tone={o.paymentStatus === 'paid' ? 'good' : o.paymentStatus === 'failed' ? 'bad' : 'warn'}>{o.paymentStatus === 'paid' ? 'Pagado' : o.paymentStatus === 'failed' ? 'Pago fallido' : 'Sin pagar'}</Badge>
                      <Badge>{o.paymentMethod === 'whatsapp' ? 'Por WhatsApp' : 'En línea'}</Badge>
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="sr-only" htmlFor={`st-${o.id}`}>Estado del pedido {o.code}</label>
                      <select id={`st-${o.id}`} className="field w-auto" value={o.status} disabled={o.status === 'cancelled'} onChange={(e) => update(o, e.target.value)}>
                        {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                      <a href={whatsappLink(o.customer.phone, `Hola ${o.customer.name}, te escribimos de Cumbre sobre tu pedido ${o.code}.`)}
                        target="_blank" rel="noreferrer" className="btn btn-ghost min-h-11 text-leaf">
                        <WhatsAppIcon size={18} /> Escribir al cliente
                      </a>
                    </div>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
