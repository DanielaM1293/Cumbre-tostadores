import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { CartIcon, MoonIcon, SunIcon } from './Icons.jsx';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Cumbre Tostadores, ir al inicio">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="15" fill="var(--ink)" />
        <g transform="rotate(-28 32 32)">
          <ellipse cx="32" cy="32" rx="14" ry="20" fill="var(--roast)" style={{ transition: 'fill .5s' }} />
          <path d="M32 13c-7 12 7 26 0 38" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </svg>
      <span className="font-display text-xl font-extrabold leading-none tracking-tight">
        Cumbre <span className="font-medium text-muted">tostadores</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { count, items } = useCart();
  const { openCart, dark, toggleTheme } = useUI();
  const badge = useRef(null);
  const first = useRef(true);

  // El contador “salta” cuando cambia: confirma que el producto entró al carrito.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = badge.current;
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }, [count]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
          <NavLink to="/#catalogo" className="hidden rounded-full px-3 py-2 font-medium hover:bg-sunk sm:block">Cafés</NavLink>
          <a href="#contacto" className="hidden rounded-full px-3 py-2 font-medium hover:bg-sunk sm:block">Contacto</a>
          <button type="button" onClick={toggleTheme} className="grid size-11 place-items-center rounded-full hover:bg-sunk"
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button type="button" onClick={openCart}
            className="relative grid size-11 place-items-center rounded-full bg-ink text-bg hover:opacity-90"
            aria-label={`Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}>
            <CartIcon />
            {items.length > 0 && (
              <span ref={badge} className="tabnum absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-cherry px-1 text-xs font-bold text-on-cherry">
                {count}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
