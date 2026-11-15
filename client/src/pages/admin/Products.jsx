import { useMemo, useRef, useState } from 'react';
import { ErrorState, Field, Skeleton } from '../../components/Bits.jsx';
import { EditIcon, ImageIcon, PlusIcon, SearchIcon, TrashIcon } from '../../components/Icons.jsx';
import ProductArt from '../../components/ProductArt.jsx';
import Sheet from '../../components/Sheet.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useFetch } from '../../hooks/useHooks.js';
import { ApiError, api } from '../../lib/api.js';
import { formatCOP } from '../../lib/format.js';
import { ROASTS } from '../../lib/roast.js';

const BLANK = {
  name: '', description: '', price: '', category: 'Café en grano', origin: '', altitude: '', roast: '',
  notes: '', weightG: '', stock: '', active: true, imageUrl: '', color: '#8a5a3c',
};

const fromProduct = (p) => ({
  ...BLANK, ...p, notes: p.notes.join(', '), price: String(p.price), stock: String(p.stock),
  altitude: p.altitude ?? '', roast: p.roast ?? '', weightG: p.weightG ?? '',
});

const num = (v) => (v === '' || v === null ? null : Number(v));

function ProductForm({ product, categories, onClose, onSaved }) {
  const { toast } = useUI();
  const [form, setForm] = useState(product ? fromProduct(product) : BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { imageUrl } = await api('/products/upload', { method: 'POST', form: fd });
      setForm((f) => ({ ...f, imageUrl }));
    } catch (err) {
      setErrors((er) => ({ ...er, imageUrl: err.message }));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      ...form,
      price: num(form.price) ?? undefined,
      stock: num(form.stock) ?? undefined,
      altitude: num(form.altitude),
      roast: num(form.roast),
      weightG: num(form.weightG),
      notes: form.notes.split(',').map((n) => n.trim()).filter(Boolean),
    };
    try {
      const saved = await api(product ? `/products/${product.id}` : '/products', { method: product ? 'PUT' : 'POST', body });
      toast(product ? 'Cambios guardados.' : `${saved.name} creado.`);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.fields.length) setErrors(err.fieldMap);
      else setErrors({ _form: err.message });
      setBusy(false);
    }
  };

  const inp = (k, label, props = {}) => (
    <Field label={label} htmlFor={`p-${k}`} error={errors[k]}>
      <input id={`p-${k}`} className="field" value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} {...props} />
    </Field>
  );

  return (
    <form onSubmit={save} noValidate className="space-y-5 pb-2">
      <div className="flex items-center gap-4 rounded-2xl p-3" style={{ background: `color-mix(in oklab, ${form.color} 16%, var(--sunk))` }}>
        <ProductArt product={{ ...form, name: form.name || 'Nombre', weightG: num(form.weightG) }} title={false} className="size-28 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold">{form.name || 'Nombre del producto'}</p>
          <p className="tabnum text-muted">{form.price ? formatCOP(Number(form.price)) : 'Sin precio'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="p-image"
              onChange={(e) => upload(e.target.files?.[0])} />
            <label htmlFor="p-image" className="btn btn-ghost min-h-9 cursor-pointer bg-surface px-3 text-sm has-[:focus-visible]:outline-2">
              <ImageIcon size={16} /> {uploading ? 'Subiendo…' : form.imageUrl ? 'Cambiar foto' : 'Subir foto'}
            </label>
            {form.imageUrl && <button type="button" className="btn btn-ghost min-h-9 bg-surface px-3 text-sm" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}>Quitar foto</button>}
          </div>
          {errors.imageUrl && <p className="mt-1 text-sm font-medium text-cherry">{errors.imageUrl}</p>}
          {!form.imageUrl && <p className="mt-1 text-xs text-muted">Sin foto, se muestra una ilustración con el color elegido.</p>}
        </div>
      </div>

      {inp('name', 'Nombre', { required: true, maxLength: 80 })}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría" htmlFor="p-category" error={errors.category}>
          <input id="p-category" list="cats" className="field" value={form.category} onChange={set('category')} aria-invalid={Boolean(errors.category)} />
          <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        {inp('price', 'Precio en pesos', { type: 'number', min: 0, step: 500, inputMode: 'numeric' })}
        {inp('stock', 'Unidades en stock', { type: 'number', min: 0, inputMode: 'numeric' })}
        {inp('weightG', 'Peso en gramos', { type: 'number', min: 0, inputMode: 'numeric' })}
        {inp('origin', 'Origen', { placeholder: 'Huila, Pitalito' })}
        {inp('altitude', 'Altitud en msnm', { type: 'number', min: 0, inputMode: 'numeric' })}
        <Field label="Tueste" htmlFor="p-roast">
          <select id="p-roast" className="field" value={form.roast} onChange={set('roast')}>
            <option value="">No aplica</option>
            {ROASTS.map((r) => <option key={r.level} value={r.level}>{r.level}. {r.name}</option>)}
          </select>
        </Field>
        <Field label="Color de la bolsa" htmlFor="p-color" error={errors.color}>
          <div className="flex gap-2">
            <input type="color" aria-label="Elegir color" value={form.color} onChange={set('color')} className="h-11 w-14 cursor-pointer rounded-lg border-[1.5px] border-line bg-surface p-1" />
            <input id="p-color" className="field" value={form.color} onChange={set('color')} maxLength={7} />
          </div>
        </Field>
      </div>
      {inp('notes', 'Notas de cata', { placeholder: 'panela, naranja, jazmín', 'aria-describedby': undefined })}
      <p className="-mt-3 text-sm text-muted">Sepáralas con comas.</p>
      <Field label="Descripción" htmlFor="p-description" error={errors.description}>
        <textarea id="p-description" rows={4} className="field" value={form.description} onChange={set('description')} maxLength={1000} />
      </Field>
      <label className="flex cursor-pointer items-center gap-3 font-medium">
        <input type="checkbox" className="size-5 accent-[var(--cherry)]" checked={form.active} onChange={set('active')} />
        Visible en la tienda
      </label>

      {errors._form && <p role="alert" className="text-sm font-medium text-cherry">{errors._form}</p>}
      <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-line bg-surface px-5 pt-4">
        <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancelar</button>
        <button type="submit" disabled={busy} className="btn btn-primary flex-1">{busy ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}</button>
      </div>
    </form>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-leaf' : 'bg-line'}`}>
      <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function Products() {
  const { data, error, refetch } = useFetch('/products?all=1');
  const { toast } = useUI();
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [deleting, setDeleting] = useState(null);
  const [q, setQ] = useState('');

  const items = useMemo(() => (data?.items ?? []).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())), [data, q]);

  const patch = async (p, body) => {
    try {
      await api(`/products/${p.id}`, { method: 'PATCH', body });
      refetch();
    } catch (err) {
      toast(err.message);
    }
  };

  const remove = async () => {
    try {
      await api(`/products/${deleting.id}`, { method: 'DELETE' });
      toast(`${deleting.name} eliminado.`);
      setDeleting(null);
      refetch();
    } catch (err) {
      toast(err.message);
    }
  };

  if (error && !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input type="search" className="field pl-10" placeholder="Buscar producto" aria-label="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><PlusIcon size={18} /> Nuevo producto</button>
      </div>

      {!data ? <Skeleton className="mt-6 h-72" /> : (
        <div className="relative mt-6 overflow-x-auto rounded-3xl bg-surface">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">Productos de la tienda</caption>
            <thead className="text-sm text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="px-5 py-3 font-medium">Producto</th>
                <th scope="col" className="px-3 py-3 font-medium">Precio</th>
                <th scope="col" className="px-3 py-3 font-medium">Stock</th>
                <th scope="col" className="px-3 py-3 font-medium">Visible</th>
                <th scope="col" className="px-5 py-3 text-right font-medium"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p.id} className={p.active ? '' : 'opacity-60'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 rounded-lg" style={{ background: `color-mix(in oklab, ${p.color} 16%, var(--sunk))` }}>
                        <ProductArt product={p} title={false} className="size-full rounded-lg p-0.5" />
                      </div>
                      <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="text-sm text-muted">{p.category}</p></div>
                    </div>
                  </td>
                  <td className="tabnum px-3 py-3">{formatCOP(p.price)}</td>
                  <td className="px-3 py-3">
                    <input type="number" min={0} defaultValue={p.stock} key={`${p.id}-${p.stock}`} aria-label={`Stock de ${p.name}`}
                      className={`field tabnum w-20 ${p.stock <= 5 ? 'border-cherry' : ''}`}
                      onBlur={(e) => { const v = Number(e.target.value); if (v !== p.stock && v >= 0) patch(p, { stock: v }); }}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
                  </td>
                  <td className="px-3 py-3"><Switch checked={p.active} label={`${p.name} visible en la tienda`} onChange={(v) => patch(p, { active: v })} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`} className="grid size-10 place-items-center rounded-full hover:bg-sunk"><EditIcon size={18} /></button>
                      <button type="button" onClick={() => setDeleting(p)} aria-label={`Eliminar ${p.name}`} className="grid size-10 place-items-center rounded-full text-cherry hover:bg-cherry/10"><TrashIcon size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">{q ? 'Ningún producto coincide con tu búsqueda.' : 'Aún no hay productos. Crea el primero.'}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)} wide title={editing === 'new' ? 'Nuevo producto' : 'Editar producto'}>
        {editing && (
          <ProductForm key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? null : editing}
            categories={data?.categories.map((c) => c.name) ?? []}
            onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
        )}
      </Sheet>

      <Sheet open={Boolean(deleting)} onClose={() => setDeleting(null)} side="center" title="¿Eliminar producto?"
        footer={<div className="flex gap-3"><button type="button" className="btn btn-ghost flex-1" onClick={() => setDeleting(null)}>Cancelar</button><button type="button" className="btn btn-primary flex-1" onClick={remove}>Eliminar</button></div>}>
        <p>Vas a eliminar <strong>{deleting?.name}</strong>. Los pedidos anteriores que lo incluyen se conservan. Si solo quieres dejar de venderlo, ocúltalo.</p>
      </Sheet>
    </div>
  );
}
