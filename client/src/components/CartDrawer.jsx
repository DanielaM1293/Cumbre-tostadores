import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { formatCOP } from '../lib/format.js';
import { Stepper } from './Bits.jsx';
import { TrashIcon } from './Icons.jsx';
import ProductArt from './ProductArt.jsx';
import Sheet from './Sheet.jsx';

function ShippingProgress({ subtotal, remaining, from }) {
  const pct = Math.min(100, Math.round((subtotal / from) * 100));
  return (
    <div className="mb-5 rounded-2xl bg-sunk p-4">
      <p className="text-sm font-medium">
        {remaining === 0
          ? 'Tu envío es gratis.'
          : <>Te faltan <strong className="tabnum">{formatCOP(remaining)}</strong> para el envío gratis.</>}
      </p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line" role="progressbar"
        aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso hacia el envío gratis">
        <div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { cartOpen, closeCart, config } = useUI();
  const cart = useCart();
  const empty = cart.items.length === 0;

  const footer = !empty && (
    <div>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabnum">{formatCOP(cart.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="tabnum">{cart.shipping === 0 ? 'Gratis' : formatCOP(cart.shipping)}</dd></div>
        <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total</dt><dd className="tabnum">{formatCOP(cart.total)}</dd></div>
      </dl>
      <Link to="/checkout" onClick={closeCart} className="btn btn-primary mt-4 w-full">Continuar con el pedido</Link>
    </div>
  );

  return (
    <Sheet open={cartOpen} onClose={closeCart} title="Tu carrito" footer={footer}>
      {empty ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl font-bold">Tu carrito está vacío</p>
          <p className="mx-auto mt-2 max-w-xs text-muted">Elige un tueste y agrega tu primer café.</p>
          <Link to="/#catalogo" onClick={closeCart} className="btn btn-dark mt-6">Ver los cafés</Link>
        </div>
      ) : (
        <>
          <ShippingProgress subtotal={cart.subtotal} remaining={cart.remainingForFree} from={config.freeShippingFrom} />
          <ul className="divide-y divide-line">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                <Link to={`/producto/${item.id}`} onClick={closeCart}
                  className="size-20 shrink-0 overflow-hidden rounded-xl"
                  style={{ background: `color-mix(in oklab, ${item.color} 16%, var(--sunk))` }}>
                  <ProductArt product={item} title={false} className="size-full p-1" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/producto/${item.id}`} onClick={closeCart} className="font-semibold leading-tight hover:underline">{item.name}</Link>
                    <button type="button" onClick={() => cart.remove(item.id)} aria-label={`Quitar ${item.name} del carrito`}
                      className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-sunk hover:text-cherry">
                      <TrashIcon size={18} />
                    </button>
                  </div>
                  <p className="tabnum text-sm text-muted">{formatCOP(item.price)} c/u</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Stepper value={item.qty} max={cart.maxFor(item)} label={`Cantidad de ${item.name}`}
                      onChange={(q) => cart.setQty(item.id, q)} />
                    <span className="tabnum font-bold">{formatCOP(item.price * item.qty)}</span>
                  </div>
                  {item.qty >= cart.maxFor(item) && item.stock <= 20 && (
                    <p className="mt-1.5 text-xs text-muted">Es todo lo que tenemos en stock.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
