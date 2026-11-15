export const ROASTS = [
  { level: 1, name: 'Claro', color: '#e4b25a', notes: 'Cítrico, floral y muy brillante. Para filtrados y V60.' },
  { level: 2, name: 'Medio-claro', color: '#cc8a3e', notes: 'Dulce como panela, con fruta madura. El más versátil.' },
  { level: 3, name: 'Medio', color: '#a06a3d', notes: 'Equilibrado: cacao, nuez y buen cuerpo.' },
  { level: 4, name: 'Medio-oscuro', color: '#744730', notes: 'Chocolate amargo y almendra tostada. Va bien con leche.' },
  { level: 5, name: 'Oscuro', color: '#432b25', notes: 'Intenso y espeso, con melaza. Para espresso y moka.' },
];

export const roastInfo = (level) => ROASTS[(level ?? 3) - 1] ?? ROASTS[2];
