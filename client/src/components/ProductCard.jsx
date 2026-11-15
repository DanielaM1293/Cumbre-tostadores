import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { formatCOP } from '../lib/format.js';
import { RoastMeter } from './Bits.jsx';
import ProductArt from './ProductArt.jsx';

export default function ProductCard({ product }) {
  const { add, qtyOf } = useCart();
  const { toast, openCart } = useUI();
  const soldOut = product.stock === 0;
  const inCart = qtyOf(product.id);
  const atMax = inCart >= Math.min(product.stock, 20);

  const onAdd = () => {
    add(product, 1);
    toast(`${product.name} está en tu carrito.`, { label: 'Ver carrito', onClick: openCart });
  };

  return (
    <article className="group relative flex min-w-0 flex-col">
      <div className="relative overflow-hidden rounded-2xl"
        style={{ background: `color-mix(in oklab, ${product.color} 15%, var(--sunk))` }}>
        <ProductArt product={product}
          className={`aspect-[4/5] w-full p-6 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:-rotate-2 ${soldOut ? 'opacity-45 grayscale' : ''}`} />
        {soldOut && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-bg">Agotado</span>}
        {!soldOut && product.stock <= 5 && (
          <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-bold text-cherry">
            Quedan {product.stock}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="min-w-0 text-xl font-bold leading-tight">
          <Link to={`/producto/${product.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
            {product.name}
          </Link>
        </h3>
        <p className="tabnum shrink-0 font-semibold">{formatCOP(product.price)}</p>
      </div>
      <p className="text-sm text-muted">{product.origin || product.category}</p>
      {product.notes.length > 0 && <p className="mt-1 text-sm">{product.notes.join(', ')}</p>}
      <div className="mt-2 min-h-[0.5rem]"><RoastMeter level={product.roast} /></div>

      <div className="mt-auto pt-4">
        <button type="button" onClick={onAdd} disabled={soldOut || atMax} className="btn btn-primary relative z-10 w-full">
          {soldOut ? 'Agotado' : atMax ? 'Ya tienes todo el stock' : inCart > 0 ? `Añadir otro (${inCart} en carrito)` : 'Añadir al carrito'}
        </button>
      </div>
    </article>
  );
}
