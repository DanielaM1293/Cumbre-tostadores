import { formatCOP } from '../lib/format.js';
import { ROASTS } from '../lib/roast.js';

const SORTS = [
  ['newest', 'Más nuevos'],
  ['price_asc', 'Precio: menor a mayor'],
  ['price_desc', 'Precio: mayor a menor'],
  ['name', 'Nombre de A a Z'],
  ['roast', 'Tueste: de claro a oscuro'],
];
export { SORTS };

function Group({ title, children }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 font-display text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function Filters({ filters, setParam, data, activeCount, onClear }) {
  const range = data?.priceRange ?? { min: 0, max: 0 };
  const floor = Math.floor(range.min / 1000) * 1000;
  const ceil = Math.ceil(range.max / 1000) * 1000;
  const maxValue = filters.max ? Number(filters.max) : ceil;

  return (
    <div className="space-y-7">
      <Group title="Categoría">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" aria-pressed={!filters.category} onClick={() => setParam({ category: '' })}>Todas</button>
          {(data?.categories ?? []).map((c) => (
            <button key={c.name} type="button" className="chip" aria-pressed={filters.category === c.name}
              onClick={() => setParam({ category: filters.category === c.name ? '' : c.name })}>
              {c.name} <span className="tabnum ml-1.5 opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Tueste">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" aria-pressed={!filters.roast} onClick={() => setParam({ roast: '' })}>Todos</button>
          {ROASTS.map((r) => (
            <button key={r.level} type="button" className="chip gap-2" aria-pressed={String(filters.roast) === String(r.level)}
              onClick={() => setParam({ roast: String(filters.roast) === String(r.level) ? '' : r.level })}>
              <span className="size-2.5 rounded-full" style={{ background: r.color }} aria-hidden="true" />
              {r.name}
            </button>
          ))}
        </div>
      </Group>

      {ceil > floor && (
        <Group title="Precio">
          <label htmlFor="price-max" className="tabnum mb-1 block text-sm text-muted">
            Hasta <strong className="text-ink">{formatCOP(maxValue)}</strong>
          </label>
          <input id="price-max" type="range" className="price-range" min={floor} max={ceil} step={1000} value={maxValue}
            onChange={(e) => setParam({ max: Number(e.target.value) >= ceil ? '' : e.target.value })} />
          <div className="tabnum flex justify-between text-xs text-muted" aria-hidden="true">
            <span>{formatCOP(floor)}</span><span>{formatCOP(ceil)}</span>
          </div>
        </Group>
      )}

      <label className="flex cursor-pointer items-center gap-3 font-medium">
        <input type="checkbox" className="size-5 accent-[var(--cherry)]" checked={filters.stock}
          onChange={(e) => setParam({ stock: e.target.checked })} />
        Solo productos disponibles
      </label>

      {activeCount > 0 && (
        <button type="button" onClick={onClear} className="font-semibold text-cherry underline underline-offset-4">
          Quitar {activeCount === 1 ? 'el filtro' : `los ${activeCount} filtros`}
        </button>
      )}
    </div>
  );
}
