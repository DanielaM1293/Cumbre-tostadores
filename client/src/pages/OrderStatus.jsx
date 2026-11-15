import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Badge, ErrorState, Skeleton } from '../components/Bits.jsx';
import { CheckIcon, WhatsAppIcon } from '../components/Icons.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useDocumentTitle, useFetch } from '../hooks/useHooks.js';
import { ApiError, api } from '../lib/api.js';
import { formatCOP, formatDate } from '../lib/format.js';

const STEPS = [
  ['pending', 'Pedido recibido'],
  ['paid', 'Pago confirmado'],
  ['preparing', 'Preparando tu café'],
  ['shipped', 'En camino'],
  ['delivered', 'Entregado'],
];

function Timeline({ status }) {
  const current = STEPS.findIndex(([k]) => k === status);
  return (
    <ol className="mt-6 space-y-0">
      {STEPS.map(([key, label], i) => {
        const done = i <= current;
        return (
          <li key={key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={i === current ? 'step' : undefined}>
            {i < STEPS.length - 1 && <span className={`absolute left-[0.95rem] top-8 h-[calc(100%-1.5rem)] w-0.5 ${i < current ? 'bg-leaf' : 'bg-line'}`} aria-hidden="true" />}
            <span className={`z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 ${done ? 'border-leaf bg-leaf text-bg' : 'border-line bg-surface text-transparent'}`}>
              <CheckIcon size={16} />
            </span>
            <span className={`pt-1 ${done ? 'font-semibold' : 'text-muted'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderStatus() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { state } = useLocation();
  const { toast } = useUI();
  const [paying, setPaying] = useState(false);
  useDocumentTitle('Tu pedido');

  const { data, error, refetch } = useFetch(`/orders/${id}/public?token=${encodeURIComponent(token)}`, { enabled: Boolean(token) });
  const order = data?.order;

  // Mientras se espera la confirmación de un pago en línea, consulta cada 6 segundos.
  const waitingPayment = order && order.paymentMethod === 'online' && order.paymentStatus === 'unpaid' && order.status !== 'cancelled';
  useEffect(() => {
    if (!waitingPayment) return;
    const t = setInterval(refetch, 6000);
    return () => clearInterval(t);
  }, [waitingPayment, refetch]);

  const retryPayment = async () => {
    setPaying(true);
    try {
      const pay = await api('/payments/create', { method: 'POST', auth: false, body: { orderId: Number(id), token } });
      if (pay.mode === 'simulated') window.location.assign(`/pago-simulado/${id}?token=${token}`);
      else window.location.href = pay.url;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'No pudimos iniciar el pago.');
      setPaying(false);
    }
  };

  if (!token || (error && error.status === 404)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-4xl font-extrabold">No encontramos ese pedido</h1>
        <p className="mt-3 text-muted">Revisa que el enlace esté completo. Lo recibes al terminar tu pedido.</p>
        <Link to="/" className="btn btn-dark mt-6">Volver a la tienda</Link>
      </div>
    );
  }
  if (error && !order) return <div className="mx-auto max-w-lg px-4 py-20"><ErrorState error={error} onRetry={refetch} /></div>;
  if (!order) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-12" aria-busy="true"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-64" /></div>;

  const cancelled = order.status === 'cancelled';
  const needsWhatsApp = order.paymentMethod === 'whatsapp' && order.status === 'pending';
  const needsPayment = order.paymentMethod === 'online' && order.paymentStatus !== 'paid' && !cancelled;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-muted">Pedido {order.code}, {formatDate(order.createdAt)}</p>
      <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl" style={{ fontStretch: '85%' }}>
        {cancelled ? 'Este pedido fue cancelado' : order.paymentStatus === 'paid' ? 'Pago recibido, gracias' : state?.justCreated ? 'Recibimos tu pedido' : 'Estado de tu pedido'}
      </h1>

      {needsWhatsApp && (
        <div className="mt-6 rounded-3xl bg-leaf/12 p-6">
          <p className="text-lg font-semibold">Falta un paso: envíanos el pedido por WhatsApp.</p>
          <p className="mt-1 text-muted">El mensaje ya está escrito. Solo tienes que enviarlo y te confirmamos el pago y el envío.</p>
          <a href={data.whatsappUrl} target="_blank" rel="noreferrer" className="btn mt-4 bg-leaf text-bg hover:opacity-90">
            <WhatsAppIcon size={20} /> Enviar pedido por WhatsApp
          </a>
        </div>
      )}

      {needsPayment && (
        <div className="mt-6 rounded-3xl bg-roast/20 p-6">
          <p className="text-lg font-semibold">{order.paymentStatus === 'failed' ? 'El pago no se completó.' : 'Tu pago está pendiente.'}</p>
          <p className="mt-1 text-muted">Tu pedido está reservado. Puedes pagar ahora y lo preparamos enseguida.</p>
          <button type="button" onClick={retryPayment} disabled={paying} className="btn btn-primary mt-4">
            {paying ? 'Abriendo el pago…' : `Pagar ${formatCOP(order.total)}`}
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.1fr]">
        <section aria-labelledby="progreso">
          <h2 id="progreso" className="text-2xl font-bold">Progreso</h2>
          {cancelled ? <p className="mt-4 text-muted">Si fue un error, escríbenos por WhatsApp y lo resolvemos.</p> : <Timeline status={order.status} />}
        </section>

        <section aria-labelledby="detalle" className="rounded-3xl bg-surface p-6">
          <h2 id="detalle" className="text-2xl font-bold">Detalle</h2>
          <ul className="mt-3 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.name} className="flex justify-between gap-3 py-2.5">
                <span>{i.quantity} × {i.name}</span>
                <span className="tabnum font-medium">{formatCOP(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-line pt-3">
            <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="tabnum">{order.shipping === 0 ? 'Gratis' : formatCOP(order.shipping)}</dd></div>
            <div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd className="tabnum">{formatCOP(order.total)}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={order.paymentStatus === 'paid' ? 'good' : order.paymentStatus === 'failed' ? 'bad' : 'warn'}>
              {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'failed' ? 'Pago fallido' : 'Sin pagar'}
            </Badge>
            <Badge>{order.paymentMethod === 'whatsapp' ? 'Pedido por WhatsApp' : 'Pago en línea'}</Badge>
          </div>
          <p className="mt-4 text-sm text-muted">Envío a {order.customer.address}, {order.customer.city}.</p>
        </section>
      </div>

      <Link to="/" className="btn btn-ghost mt-10">Seguir comprando</Link>
    </div>
  );
}
