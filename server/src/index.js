import { config, mpEnabled } from './config.js';
import { seedAll } from './seed.js';
import { createApp } from './app.js';

const seeded = seedAll();
const app = createApp();

app.listen(config.port, () => {
  console.log(`☕ API lista en http://localhost:${config.port}`);
  if (seeded) console.log('   Catálogo de ejemplo cargado.');
  console.log(`   Pagos: ${mpEnabled ? 'Mercado Pago' : 'modo simulado (sin MP_ACCESS_TOKEN)'}`);
  console.log(`   Admin: ${config.admin.email}`);
});
