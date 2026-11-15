import { roastInfo } from '../lib/roast.js';
import { MinusIcon, PlusIcon } from './Icons.jsx';

export function RoastMeter({ level, showName = false }) {
  if (!level) return null;
  const info = roastInfo(level);
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Tueste ${info.name.toLowerCase()}, ${level} de 5`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="h-1.5 w-4 rounded-full"
            style={{ background: n <= level ? info.color : 'var(--line)' }} />
        ))}
      </div>
      {showName && <span className="text-sm text-muted">{info.name}</span>}
    </div>
  );
}

export function Stepper({ value, min = 1, max = 20, onChange, label }) {
  return (
    <div className="inline-flex items-center rounded-full border-[1.5px] border-line" role="group" aria-label={label}>
      <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-sunk disabled:opacity-40"
        onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Una unidad menos">
        <MinusIcon size={16} />
      </button>
      <output className="tabnum min-w-8 text-center font-semibold" aria-live="polite">{value}</output>
      <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-sunk disabled:opacity-40"
        onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Una unidad más">
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

export function ProductSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/5] rounded-2xl" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-4 h-11 w-full rounded-full" />
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="font-display text-xl font-bold">No pudimos cargar los datos</p>
      <p className="mx-auto mt-2 max-w-sm text-muted">{error?.message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn btn-dark mt-5">Intentar de nuevo</button>}
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} className="mt-1 text-sm font-medium text-cherry">{error}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-sunk text-ink',
    good: 'bg-leaf/15 text-leaf',
    warn: 'bg-roast/20 text-ink',
    bad: 'bg-cherry/15 text-cherry',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
