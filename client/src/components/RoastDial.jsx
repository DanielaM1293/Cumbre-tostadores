import { useEffect } from 'react';
import { ROASTS, roastInfo } from '../lib/roast.js';
import { plural } from '../lib/format.js';

function Bean({ level }) {
  return (
    <svg viewBox="0 0 200 200" className="bean-in mx-auto w-44 sm:w-56" aria-hidden="true">
      <g style={{ transform: `rotate(${-34 + level * 9}deg)`, transformOrigin: '100px 100px', transition: 'transform .6s cubic-bezier(.2,.9,.2,1)' }}>
        <ellipse cx="100" cy="100" rx="62" ry="86" style={{ fill: 'var(--roast)', transition: 'fill .6s' }} />
        <ellipse cx="78" cy="62" rx="14" ry="30" fill="#fff" opacity=".16" transform="rotate(14 78 62)" />
        <path d="M100 16C66 70 134 130 100 184" stroke="rgb(0 0 0 / .38)" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Control principal de la portada: elegir un tueste cambia el color de toda la página.
export default function RoastDial({ level, onChange, counts, onShow }) {
  const info = roastInfo(level);
  const n = counts[level] ?? 0;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--roast', info.color);
    return () => root.style.removeProperty('--roast');
  }, [info.color]);

  return (
    <div className="rounded-[2rem] bg-surface p-6 shadow-[0_24px_60px_-30px_rgb(38_20_26/.45)] sm:p-8">
      <Bean level={level} />
      <div className="mt-5 text-center" aria-live="polite">
        <p className="font-display text-3xl font-extrabold" style={{ fontStretch: '85%' }}>Tueste {info.name.toLowerCase()}</p>
        <p className="mx-auto mt-1 min-h-[3rem] max-w-xs text-muted">{info.notes}</p>
      </div>

      <div className="mt-4">
        <label htmlFor="roast-range" className="sr-only">Nivel de tueste</label>
        <input id="roast-range" type="range" min={1} max={5} step={1} value={level} className="roast-range"
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`${info.name}, nivel ${level} de 5`} />
        <div className="mt-1 flex justify-between text-sm text-muted" aria-hidden="true">
          {ROASTS.map((r) => (
            <span key={r.level} className={`w-1/5 text-center first:text-left last:text-right ${r.level === level ? 'font-semibold text-ink' : ''} ${[2, 4].includes(r.level) ? 'hidden sm:block' : ''}`}>
              {r.level === 3 ? 'Medio' : r.level === 2 ? 'M. claro' : r.level === 4 ? 'M. oscuro' : r.name}
            </span>
          ))}
        </div>
      </div>

      <button type="button" disabled={n === 0} onClick={() => onShow(level)} className="btn btn-dark mt-6 w-full">
        {n > 0 ? `Ver ${plural(n, 'café', 'cafés')} de este tueste` : 'Aún no tenemos este tueste'}
      </button>
    </div>
  );
}
