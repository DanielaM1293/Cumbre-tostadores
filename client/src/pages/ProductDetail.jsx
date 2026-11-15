import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, RoastMeter, Skeleton, Stepper } from '../components/Bits.jsx';
import ProductArt from '../components/ProductArt.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useDocumentTitle, useFetch } from '../hooks/useHooks.js';
import { formatCOP } from '../lib/format.js';
import { roastInfo } from '../lib/roast.js';

function Spec({ label, children }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 border-t border-line py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { data: p, error, refetch } = useFetch(`/products/${id}`);
  const { add, qtyOf } = useCart();
  const { toast, openCart } = useUI();
  const [qty, setQty] = useState(1);
  useDocumentTitle(p?.name);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        {error.status === 404 ? (
          <>
            <h1 className="text-4xl font-extrabold">Ese café no existe</h1>
            <p className="mt-3 text-muted">Puede que ya no lo tengamos o que el enlace esté mal escrito.</p>
            <Link to="/#catalogo" className="btn btn-dark mt-6">Ver todos los cafés</Link>
          </>
        ) : <ErrorState error={error} onRetry={refetch} />}
      </div>
    );
  }

  if (!p || String(p.id) !== String(id)) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2" aria-busy="true">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4 pt-4"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-28 w-full" /></div>
      </div>
    );
  }

  const soldOut = p.stock === 0;
  const maxQty = Math.max(1, Math.min(p.stock - qtyOf(p.id), 20));
  const canAdd = !soldOut && qtyOf(p.id) < Math.min(p.stock, 20);

  const onAdd = () => {
    add(p, qty);
    toast(`${qty === 1 ? '1 unidad' : `${qty} unidades`} de ${p.name} en tu carrito.`, { label: 'Ver carrito', onClick: openCart });
    setQty(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/#catalogo" className="inline-flex min-h-11 items-center font-medium text-muted hover:text-ink">← Todos los cafés</Link>

      <div className="mt-4 grid gap-10 md:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-3xl" style={{ background: `color-mix(in oklab, ${p.color} 16%, var(--sunk))` }}>
          <ProductArt product={p} className={`aspect-square w-full p-10 sm:p-14 ${soldOut ? 'opacity-50 grayscale' : ''}`} />
        </div>

        <div>
          <p className="text-muted">{p.category}</p>
          <h1 className="mt-1 text-5xl font-extrabold sm:text-6xl" style={{ fontStretch: '82%' }}>{p.name}</h1>
          <p className="tabnum mt-4 text-3xl font-bold">{formatCOP(p.price)}</p>
          {p.description && <p className="mt-5 max-w-prose text-lg">{p.description}</p>}

          <dl className="mt-7">
            {p.origin && <Spec label="Origen">{p.origin}</Spec>}
            {p.altitude && <Spec label="Altitud"><span className="tabnum">{p.altitude.toLocaleString('es-CO')}</span> msnm</Spec>}
            {p.roast && <Spec label="Tueste"><div className="flex flex-col gap-1.5"><RoastMeter level={p.roast} /><span className="text-sm text-muted">{roastInfo(p.roast).name}. {roastInfo(p.roast).notes}</span></div></Spec>}
            {p.notes.length > 0 && (
              <Spec label="En taza">
                <ul className="flex flex-wrap gap-2">{p.notes.map((n) => <li key={n} className="rounded-full bg-sunk px-3 py-0.5 text-sm">{n}</li>)}</ul>
              </Spec>
            )}
            {p.weightG && <Spec label="Presentación"><span className="tabnum">{p.weightG}</span> g</Spec>}
            <Spec label="Disponibilidad">
              {soldOut ? 'Agotado por ahora' : p.stock <= 5 ? <span className="text-cherry">Quedan {p.stock}</span> : 'En stock'}
            </Spec>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Stepper value={Math.min(qty, maxQty)} max={maxQty} onChange={setQty} label="Cantidad" />
            <button type="button" onClick={onAdd} disabled={!canAdd} className="btn btn-primary min-w-56 flex-1 sm:flex-none">
              {soldOut ? 'Agotado' : !canAdd ? 'Ya tienes todo el stock' : `Añadir al carrito, ${formatCOP(p.price * Math.min(qty, maxQty))}`}
            </button>
          </div>
        </div>
      </div>

      {p.related?.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="text-3xl font-extrabold" style={{ fontStretch: '85%' }}>Otros cafés que te pueden gustar</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {p.related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
