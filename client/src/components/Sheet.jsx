import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from './Icons.jsx';

const SIDES = {
  right: 'sheet-right m-0 ml-auto h-dvh max-h-none w-full max-w-md open:flex flex-col',
  bottom: 'sheet-bottom m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-3xl open:flex flex-col',
  center: 'sheet-center m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl open:flex flex-col',
};

// Diálogo nativo <dialog>: trampa de foco, Esc y fondo inerte sin librerías.
export default function Sheet({ open, onClose, title, side = 'right', footer, children, wide = false }) {
  const ref = useRef(null);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setClosing(false);
      d.showModal();
    }
    if (!open && d.open) {
      setClosing(true);
      const t = setTimeout(() => { d.close(); setClosing(false); }, 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-closing={closing || undefined}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`sheet ${wide && side === 'right' ? SIDES.right.replace('max-w-md', 'max-w-xl') : SIDES[side]} overflow-hidden border-0 p-0 shadow-2xl`}
    >
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-2xl font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="grid size-10 place-items-center rounded-full hover:bg-sunk">
          <CloseIcon />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{open || closing ? children : null}</div>
      {footer && <footer className="border-t border-line bg-surface px-5 py-4">{footer}</footer>}
    </dialog>
  );
}
