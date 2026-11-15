import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '../components/Bits.jsx';
import { WhatsAppIcon } from '../components/Icons.jsx';
import ProductArt from '../components/ProductArt.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useDocumentTitle, useLocalStorage } from '../hooks/useHooks.js';
import { ApiError, api } from '../lib/api.js';
import { formatCOP } from '../lib/format.js';

const EMPTY = { name: '', phone: '', city: '', address: '', notes: '' };

const RULES = {
  name: (v) => (v.trim().length < 2 ? 'Escribe tu nombre.' : ''),
  phone: (v) => (/^\+?[0-9\s-]{7,16}$/.test(v.trim()) ? '' : 'Escribe un celular válido, por ejemplo 300 123 4567.'),
  city: (v) => (v.trim().length < 2 ? 'Escribe tu ciudad.' : ''),
  address: (v) => (v.trim().length < 5 ? 'Escribe tu dirección completa.' : ''),
};

function PayOption({ value, current, onChange, title, children, icon }) {
  const selected = current === value;
  return (
    <label className={`flex cursor-pointer gap-4 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cherry ${selected ? 'border-ink bg-surface' : 'border-line hover:border-muted'}`}>
      <input type="radio" name="payment" value={value} checked={selected} onChange={() => onChange(value)} className="mt-1 size-5 accent-[var(--cherry)]" />
      <span>
        <span className="flex items-center gap-2 font-semibold">{icon}{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{children}</span>
      </span>
    </label>
  );
}

export default function Checkout() {
  useDocumentTitle('Tu pedido');
  const cart = useCart();
  const { config } = useUI();
  const navigate = useNavigate();
  const [saved, setSaved] = useLocalStorage('cumbre.customer', EMPTY);
  const [form, setForm] = useState({ ...EMPTY, ...saved, notes: '' });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [payment, setPayment] = useState('whatsapp');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const refs = useRef({});

  // Antes de pedir, revisa que precios y stock del carrito sigan vigentes.
  useEffect(() => { cart.sync(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const errors = Object.fromEntries(Object.keys(RULES).map((k) => [k, RULES[k](form[k])]));
  const shown = (k) => (touched[k] ? errors[k] : '') || serverErrors[`customer.${k}`] || '';

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setServerErrors((s) => ({ ...s, [`customer.${k}`]: '' }));
  };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const firstBad = Object.keys(RULES).find((k) => errors[k]);
    if (firstBad) {
      setTouched({ name: true, phone: true, city: true, address: true });
      refs.current[firstBad]?.focus();
      return;
    }
    setBusy(true);
    let created = null;
    try {
      const { order, token } = await api('/orders', {
        method: 'POST',
        auth: false,
        body: {
          customer: { ...form },
          paymentMethod: payment,
          items: cart.items.map((i) => ({ productId: i.id, qty: i.qty })),
        },
      });
      created = { id: order.id, token };
      setSaved({ ...form, notes: '' });
      cart.clear();

      if (payment === 'online') {
        const pay = await api('/payments/create', { method: 'POST', auth: false, body: { orderId: order.id, token } });
        if (pay.mode === 'simulated') navigate(`/pago-simulado/${order.id}?token=${token}`);
        else window.location.href = pay.url;
      } else {
        navigate(`/pedido/${order.id}?token=${token}`, { state: { justCreated: true } });
      }
    } catch (err) {
      // El pedido ya existe pero el pago no arrancó: lo llevamos a su página, donde puede reintentar.
      if (created) {
        navigate(`/pedido/${created.id}?token=${created.token}`);
        return;
      }
      if (err instanceof ApiError) {
        setServerErrors(err.fieldMap);
        setFormError(err.status === 409 ? `${err.message} Actualizamos tu carrito; revísalo y vuelve a intentar.` : err.message);
        if (err.status === 409) cart.sync();
      } else {
        setFormError('Algo salió mal. Intenta de nuevo.');
      }
      setBusy(false);
    }
  };

  if (cart.items.length === 0 && !busy) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-4xl font-extrabold">Tu carrito está vacío</h1>
        <p className="mt-3 text-muted">Agrega un café para continuar con tu pedido.</p>
        <Link to="/#catalogo" className="btn btn-dark mt-6">Ver los cafés</Link>
      </div>
    );
  }

  const input = (k, label, props = {}) => (
    <Field label={label} htmlFor={`f-${k}`} error={shown(k)}>
      <input id={`f-${k}`} ref={(el) => { refs.current[k] = el; }} className="field" value={form[k]}
        onChange={set(k)} onBlur={blur(k)} aria-invalid={Boolean(shown(k))}
        aria-describedby={shown(k) ? `f-${k}-error` : undefined} {...props} />
    </Field>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl" style={{ fontStretch: '85%' }}>Tu pedido</h1>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-10">
          <section aria-labelledby="datos">
            <h2 id="datos" className="mb-4 text-2xl font-bold">¿Adónde lo enviamos?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {input('name', 'Nombre completo', { autoComplete: 'name' })}
              {input('phone', 'Celular', { autoComplete: 'tel', inputMode: 'tel', placeholder: '300 123 4567' })}
              {input('city', 'Ciudad', { autoComplete: 'address-level2' })}
              {input('address', 'Dirección', { autoComplete: 'street-address', placeholder: 'Cra 7 # 45-10, apto 301' })}
              <div className="sm:col-span-2">
                <Field label="Notas para el envío (opcional)" htmlFor="f-notes">
                  <textarea id="f-notes" rows={2} className="field" value={form.notes} onChange={set('notes')}
                    placeholder="Portería, horario, molienda que prefieres" maxLength={300} />
                </Field>
              </div>
            </div>
          </section>

          <fieldset>
            <legend className="mb-4 text-2xl font-bold">¿Cómo quieres pagar?</legend>
            <div className="grid gap-3">
              <PayOption value="whatsapp" current={payment} onChange={setPayment} title="Pedir por WhatsApp"
                icon={<WhatsAppIcon size={18} className="text-leaf" />}>
                Te abrimos el chat con tu pedido ya escrito y acordamos el pago contigo.
              </PayOption>
              <PayOption value="online" current={payment} onChange={setPayment} title="Pagar en línea">
                {config.paymentMode === 'mercadopago'
                  ? 'Paga con PSE, tarjeta o Nequi en Mercado Pago.'
                  : 'Pasarela de demostración: no se cobra dinero real.'}
              </PayOption>
            </div>
          </fieldset>
        </div>

        <aside aria-labelledby="resumen" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-surface p-6">
            <h2 id="resumen" className="text-2xl font-bold">Resumen</h2>
            <ul className="mt-4 divide-y divide-line">
              {cart.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <div className="relative size-14 shrink-0 rounded-xl" style={{ background: `color-mix(in oklab, ${i.color} 16%, var(--sunk))` }}>
                    <ProductArt product={i} title={false} className="size-full p-1" />
                    <span className="tabnum absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-xs font-bold text-bg">{i.qty}</span>
                  </div>
                  <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                  <span className="tabnum font-medium">{formatCOP(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-4">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabnum">{formatCOP(cart.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="tabnum">{cart.shipping === 0 ? 'Gratis' : formatCOP(cart.shipping)}</dd></div>
              <div className="flex justify-between pt-2 text-xl font-bold"><dt>Total</dt><dd className="tabnum">{formatCOP(cart.total)}</dd></div>
            </dl>

            {formError && <p role="alert" className="mt-4 rounded-xl bg-cherry/10 p-3 text-sm font-medium text-cherry">{formError}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full">
              {busy ? 'Enviando tu pedido…' : payment === 'whatsapp' ? 'Hacer el pedido' : `Pagar ${formatCOP(cart.total)}`}
            </button>
            <p className="mt-3 text-center text-sm text-muted">
              {payment === 'whatsapp' ? 'En el siguiente paso confirmas por WhatsApp.' : 'Te llevamos a la pantalla de pago.'}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
