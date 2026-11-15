const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
// Espacio duro entre "$" y la cifra: el precio nunca se parte en dos líneas.
export const formatCOP = (n) => cop.format(n).replace(/\s/g, ' ');

export const formatDate = (iso) =>
  new Date(iso.replace(' ', 'T') + 'Z').toLocaleString('es-CO', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Convierte un celular colombiano en un enlace de WhatsApp.
export const whatsappLink = (phone, text = '') => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = `57${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

export const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};
