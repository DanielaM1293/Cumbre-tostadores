import 'dotenv/config';

const env = process.env;

export const config = {
  port: Number(env.PORT || 4000),
  nodeEnv: env.NODE_ENV || 'development',
  clientUrl: (env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  publicApiUrl: (env.PUBLIC_API_URL || '').replace(/\/$/, ''),
  jwtSecret: env.JWT_SECRET || 'cambia-este-secreto-en-produccion',
  jwtExpires: env.JWT_EXPIRES || '8h',
  admin: {
    email: env.ADMIN_EMAIL || 'admin@cumbre.co',
    password: env.ADMIN_PASSWORD || 'admin1234',
  },
  store: {
    name: env.STORE_NAME || 'Cumbre Tostadores',
    // Número de WhatsApp con indicativo de país y sin "+" (Colombia = 57)
    whatsapp: (env.STORE_WHATSAPP || '573001234567').replace(/\D/g, ''),
    freeShippingFrom: Number(env.FREE_SHIPPING_FROM || 150000),
    shippingFlat: Number(env.SHIPPING_FLAT || 9000),
  },
  mercadoPagoToken: env.MP_ACCESS_TOKEN || '',
};

export const mpEnabled = Boolean(config.mercadoPagoToken);
export const isProd = config.nodeEnv === 'production';

if (isProd && config.jwtSecret === 'cambia-este-secreto-en-produccion') {
  console.warn('⚠️  JWT_SECRET usa el valor por defecto. Define uno propio en producción.');
}
