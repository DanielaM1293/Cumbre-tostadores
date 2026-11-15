// Catálogo de ejemplo: una tostadora ficticia de café de especialidad colombiano.
// `roast` va de 1 (tueste claro) a 5 (tueste oscuro). `color` es el color de la bolsa en la UI.
export const products = [
  {
    name: 'Mirador',
    description:
      'Lote lavado de fincas familiares cerca de Pitalito. Dulce como panela, con una acidez cítrica limpia que se queda en el paladar.',
    price: 42000, category: 'Café en grano', origin: 'Huila, Pitalito', altitude: 1750, roast: 2,
    notes: ['panela', 'naranja', 'jazmín'], weightG: 250, stock: 24, color: '#d9a441',
  },
  {
    name: 'Volcán Galeras',
    description:
      'Cultivado a más de 2.000 metros en las laderas del volcán. Taza brillante, floral y muy juguetona para filtrados.',
    price: 46000, category: 'Café en grano', origin: 'Nariño, Sandoná', altitude: 2100, roast: 1,
    notes: ['mandarina', 'caramelo', 'té negro'], weightG: 250, stock: 18, color: '#e6b84f',
  },
  {
    name: 'Arhuaca Lote 7',
    description:
      'Café de la Sierra Nevada, procesado por una cooperativa indígena arhuaca. Cuerpo redondo y final a cacao.',
    price: 44000, category: 'Café en grano', origin: 'Sierra Nevada, Magdalena', altitude: 1500, roast: 3,
    notes: ['cacao', 'nuez', 'ciruela'], weightG: 250, stock: 15, color: '#9a6b3f',
  },
  {
    name: 'Popayán Natural',
    description:
      'Proceso natural secado en camas elevadas. Frutal y festivo: fresa madura, un toque de vino y chocolate con leche.',
    price: 48000, category: 'Café en grano', origin: 'Cauca, Popayán', altitude: 1900, roast: 2,
    notes: ['fresa', 'vino tinto', 'chocolate con leche'], weightG: 250, stock: 3, color: '#b4475a',
  },
  {
    name: 'Planadas Honey',
    description:
      'Proceso honey que conserva parte del mucílago. Textura sedosa y dulzor de miel de caña, ideal para espresso suave.',
    price: 45000, category: 'Café en grano', origin: 'Tolima, Planadas', altitude: 1650, roast: 3,
    notes: ['miel', 'durazno', 'almendra'], weightG: 250, stock: 20, color: '#c97b3a',
  },
  {
    name: 'Cañón',
    description:
      'Tueste medio-oscuro de Santander para quien toma café con leche. Chocolate amargo, almendra tostada y un humo muy suave.',
    price: 39000, category: 'Café en grano', origin: 'Santander, Los Santos', altitude: 1400, roast: 4,
    notes: ['chocolate amargo', 'almendra tostada', 'humo suave'], weightG: 250, stock: 30, color: '#6b4630',
  },
  {
    name: 'Suroeste Noche',
    description:
      'Nuestro tueste más oscuro, del Suroeste antioqueño. Intenso y espeso, con melaza y clavo; aguanta bien la leche.',
    price: 38000, category: 'Café en grano', origin: 'Antioquia, Andes', altitude: 1550, roast: 5,
    notes: ['cacao oscuro', 'melaza', 'clavo'], weightG: 250, stock: 26, color: '#3e2a21',
  },
  {
    name: 'Descafeinado de caña',
    description:
      'Descafeinado con acetato de etilo derivado de la caña de azúcar, sin perder el dulzor. Para la taza de la noche.',
    price: 45000, category: 'Café en grano', origin: 'Quindío, Salento', altitude: 1600, roast: 3,
    notes: ['caramelo', 'manzana roja', 'cacao'], weightG: 250, stock: 12, color: '#5f7d62',
  },
  {
    name: 'Cold brew concentrado',
    description:
      'Extracción en frío durante 18 horas. Se sirve con hielo, agua o leche; rinde unas 8 tazas por botella.',
    price: 28000, category: 'Cold brew', origin: 'Mezcla Huila y Nariño', altitude: null, roast: 2,
    notes: ['cacao', 'cereza', 'dulce'], weightG: 500, stock: 40, color: '#2f5d6b',
  },
  {
    name: 'Prensa francesa 600 ml',
    description: 'Vidrio borosilicato y marco de acero. Cuatro minutos, una cuchara y un café con mucho cuerpo.',
    price: 89000, category: 'Accesorios', origin: '', altitude: null, roast: null,
    notes: [], weightG: null, stock: 14, color: '#8a8f94',
  },
  {
    name: 'Molinillo manual de cerámica',
    description: 'Muelas de cerámica con 18 posiciones de molienda. Silencioso, portátil y fácil de limpiar.',
    price: 135000, category: 'Accesorios', origin: '', altitude: null, roast: null,
    notes: [], weightG: null, stock: 8, color: '#a8745a',
  },
  {
    name: 'Dripper V60 de cerámica',
    description: 'Cono de cerámica hecho a mano en Ráquira. Incluye 40 filtros de papel.',
    price: 72000, category: 'Accesorios', origin: 'Ráquira, Boyacá', altitude: null, roast: null,
    notes: [], weightG: null, stock: 10, color: '#c46a4a',
  },
  {
    name: 'Taza de barro 280 ml',
    description: 'Barro negro esmaltado por dentro. Mantiene el calor y cada pieza sale con una textura distinta.',
    price: 34000, category: 'Accesorios', origin: 'La Chamba, Tolima', altitude: null, roast: null,
    notes: [], weightG: null, stock: 0, color: '#2b2b2b',
  },
  {
    name: 'Caja degustación',
    description:
      'Tres bolsas de 100 g (Volcán Galeras, Arhuaca Lote 7 y Suroeste Noche) para comparar tuesteros y orígenes.',
    price: 68000, category: 'Cajas', origin: 'Nariño, Sierra Nevada y Antioquia', altitude: null, roast: null,
    notes: ['mandarina', 'cacao', 'melaza'], weightG: 300, stock: 16, color: '#7a3b4a',
  },
];
