import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorState, ProductSkeleton } from '../components/Bits.jsx';
import Filters, { SORTS } from '../components/Filters.jsx';
import { FilterIcon, SearchIcon } from '../components/Icons.jsx';
import ProductCard from '../components/ProductCard.jsx';
import RoastDial from '../components/RoastDial.jsx';
import Sheet from '../components/Sheet.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useDocumentTitle, useProducts } from '../hooks/useHooks.js';
import { formatCOP, plural } from '../lib/format.js';

export default function Home() {
  useDocumentTitle('');
  const { config } = useUI();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(() => ({
    category: params.get('category') || '',
    q: params.get('q') || '',
    max: params.get('max') || '',
    roast: params.get('roast') || '',
    sort: params.get('sort') || 'newest',
    stock: params.get('stock') === '1',
  }), [params]);

  const { data, error, loading, refetch } = useProducts(filters);

  // El filtro vive en la URL: se puede compartir, y el botón “atrás” funciona.
  const setParam = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === '' || v === null || v === undefined || v === false) next.delete(k);
        else next.set(k, v === true ? '1' : String(v));
      }
      return next;
    }, { replace: true });

  const activeCount = ['category', 'q', 'max', 'roast'].filter((k) => filters[k]).length + (filters.stock ? 1 : 0);
  const clearAll = () => setParams(new URLSearchParams(filters.sort !== 'newest' ? { sort: filters.sort } : {}), { replace: true });

  const [level, setLevel] = useState(Number(filters.roast) || 2);
  const counts = useMemo(() => Object.fromEntries((data?.roasts ?? []).map((r) => [r.roast, r.count])), [data]);

  // Si llega con un enlace a #catalogo (desde el carrito), baja hasta allí.
  useEffect(() => {
    if (window.location.hash === '#catalogo') document.getElementById('catalogo')?.scrollIntoView();
  }, []);

  const showRoast = (lvl) => {
    setParam({ roast: lvl, category: '' });
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <section className="transition-colors duration-700" style={{ background: 'color-mix(in oklab, var(--roast) 17%, var(--bg))' }}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <h1 className="text-[clamp(2.75rem,7.5vw,5.75rem)] font-extrabold" style={{ fontStretch: '78%' }}>
              Café de fincas colombianas, tostado en lotes pequeños.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              Empieza por el tueste que más te gusta. Mueve el control y te mostramos los cafés que van contigo.
            </p>
            <a href="#catalogo" className="btn btn-ghost mt-8">Ver todos los cafés</a>
          </div>
          <RoastDial level={level} onChange={setLevel} counts={counts} onShow={showRoast} />
        </div>
        <dl className="mx-auto grid max-w-7xl gap-x-8 gap-y-3 border-t border-ink/10 px-4 py-5 text-sm sm:grid-cols-3 sm:px-6">
          <div><dt className="inline font-semibold">Envío gratis </dt><dd className="inline text-muted">desde {formatCOP(config.freeShippingFrom)}</dd></div>
          <div><dt className="inline font-semibold">Tostado cada semana </dt><dd className="inline text-muted">y despachado en 48 horas</dd></div>
          <div><dt className="inline font-semibold">Pide por WhatsApp </dt><dd className="inline text-muted">o paga en línea</dd></div>
        </dl>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold sm:text-5xl" style={{ fontStretch: '85%' }}>Nuestros cafés</h2>
            <p className="mt-2 text-muted" aria-live="polite">
              {data ? plural(data.total, 'producto', 'productos') : 'Cargando catálogo'}
              {activeCount > 0 && ' con tus filtros'}
            </p>
          </div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:w-auto">
            <div className="relative col-span-2 sm:w-64">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input type="search" className="field pl-10" placeholder="Busca por nombre, origen o nota"
                aria-label="Buscar productos" value={filters.q} onChange={(e) => setParam({ q: e.target.value })} />
            </div>
            <label className="sr-only" htmlFor="sort">Ordenar por</label>
            <select id="sort" className="field w-full sm:w-auto" value={filters.sort} onChange={(e) => setParam({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button type="button" className="btn btn-ghost lg:hidden" onClick={() => setFiltersOpen(true)}>
              <FilterIcon size={18} /> Filtros{activeCount > 0 && ` (${activeCount})`}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_1fr]">
          <aside className="hidden lg:block" aria-label="Filtros">
            <div className="sticky top-24">
              <Filters filters={filters} setParam={setParam} data={data} activeCount={activeCount} onClear={clearAll} />
            </div>
          </aside>

          <div>
            {error && !data ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : !data ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : data.items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
                <p className="font-display text-2xl font-bold">No encontramos cafés con esos filtros</p>
                <p className="mx-auto mt-2 max-w-sm text-muted">Prueba con otro tueste, sube el precio máximo o busca con otra palabra.</p>
                <button type="button" onClick={clearAll} className="btn btn-dark mt-6">Quitar filtros</button>
              </div>
            ) : (
              <div className={`grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity duration-200 md:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros" side="bottom"
        footer={<button type="button" className="btn btn-primary w-full" onClick={() => setFiltersOpen(false)}>
          Ver {data ? plural(data.total, 'producto', 'productos') : 'resultados'}
        </button>}>
        <Filters filters={filters} setParam={setParam} data={data} activeCount={activeCount} onClear={clearAll} />
      </Sheet>
    </>
  );
}
