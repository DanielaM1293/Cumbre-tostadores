import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';
import { WhatsAppIcon } from './Icons.jsx';

export default function Footer() {
  const { config } = useUI();
  return (
    <footer id="contacto" className="mt-24 border-t border-line bg-sunk">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl font-extrabold">Cumbre tostadores</p>
          <p className="mt-3 max-w-sm text-muted">
            Tostamos en lotes pequeños café de fincas familiares de Huila, Nariño, Cauca y la Sierra Nevada.
            Despachamos de lunes a viernes a todo el país.
          </p>
        </div>
        <div>
          <p className="font-semibold">Habla con nosotros</p>
          <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 font-medium text-leaf underline-offset-4 hover:underline">
            <WhatsAppIcon size={18} /> Escríbenos por WhatsApp
          </a>
          <p className="mt-2 text-muted">Lunes a sábado, 8 a. m. a 6 p. m.</p>
        </div>
        <div>
          <p className="font-semibold">Sobre este proyecto</p>
          <p className="mt-3 text-muted">
            Tienda de demostración para portafolio. Los pagos funcionan en modo de prueba y no se cobra dinero real.
          </p>
          <Link to="/admin" className="mt-2 inline-block font-medium underline underline-offset-4">Ver el panel de administración</Link>
        </div>
      </div>
    </footer>
  );
}
