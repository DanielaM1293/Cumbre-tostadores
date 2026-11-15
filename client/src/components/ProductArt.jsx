import { assetUrl } from '../lib/api.js';

// Divide el nombre en líneas cortas para que quepa en la etiqueta de la bolsa.
function wrap(name, max = 11) {
  const lines = [];
  let line = '';
  for (const word of name.split(' ')) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function Label({ x, y, w, h, name, sub }) {
  const lines = wrap(name);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = longest > 11 ? 10.5 : longest > 8 ? 13 : 16;
  const gap = size * 1.12;
  const start = y + h / 2 - ((lines.length - 1) * gap) / 2 - (sub ? 4 : 0);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill="#f7f4ee" />
      {lines.map((l, i) => (
        <text key={i} x={x + w / 2} y={start + i * gap + size * 0.35} textAnchor="middle" fontSize={size}
          fontWeight="700" fill="#26141a" style={{ fontFamily: 'var(--font-display)' }}>{l}</text>
      ))}
      {sub && (
        <text x={x + w / 2} y={y + h - 9} textAnchor="middle" fontSize="8.5" fill="#6b5b5f"
          style={{ fontFamily: 'var(--font-sans)' }}>{sub}</text>
      )}
    </g>
  );
}

const SHADOW = <ellipse cx="100" cy="226" rx="64" ry="7" fill="rgb(0 0 0 / .16)" />;
const SHADE = 'rgb(0 0 0 / .2)';
const LIGHT = 'rgb(255 255 255 / .16)';

function Bag({ color, name, weight }) {
  return (
    <>
      {SHADOW}
      <path d="M42 48h116l8 166a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6l8-166Z" fill={color} />
      <path d="M42 48h116l2 38H40l2-38Z" fill={SHADE} />
      <path d="M42 48h116" stroke={SHADE} strokeWidth="9" strokeLinecap="round" />
      {[62, 80, 98, 116, 134, 152].map((x) => <path key={x} d={`M${x} 40v14`} stroke={SHADE} strokeWidth="2" />)}
      <path d="M52 92h12v120H52z" fill={LIGHT} />
      <Label x={58} y={102} w={84} h={86} name={name} sub={weight ? `${weight} g` : ''} />
      <circle cx="100" cy="204" r="4.5" fill="#f7f4ee" opacity=".85" />
    </>
  );
}

function Bottle({ color, name }) {
  return (
    <>
      {SHADOW}
      <rect x="84" y="22" width="32" height="26" rx="5" fill="#26141a" />
      <path d="M88 48h24v22c0 8 26 12 26 36v108a8 8 0 0 1-8 8H70a8 8 0 0 1-8-8V106c0-24 26-28 26-36V48Z" fill={color} />
      <path d="M70 108v100h10V112c-6 2-10 0-10-4Z" fill={LIGHT} />
      <Label x={70} y={120} w={60} h={74} name={name} sub="500 ml" />
    </>
  );
}

function Box({ color, name }) {
  return (
    <>
      {SHADOW}
      <path d="M30 78h140l-8-30H38l-8 30Z" fill={SHADE} />
      <rect x="30" y="78" width="140" height="138" rx="6" fill={color} />
      <rect x="30" y="78" width="140" height="14" fill={SHADE} />
      <rect x="92" y="78" width="16" height="138" fill={LIGHT} />
      <Label x={48} y={116} w={104} h={70} name={name} />
    </>
  );
}

function Gear({ name, color }) {
  const n = name.toLowerCase();
  if (n.includes('prensa')) {
    return (
      <>
        {SHADOW}
        <rect x="64" y="86" width="72" height="130" rx="6" fill={color} opacity=".28" stroke={color} strokeWidth="5" />
        <rect x="64" y="150" width="72" height="66" rx="6" fill={color} opacity=".7" />
        <path d="M100 30v108" stroke="#26141a" strokeWidth="6" strokeLinecap="round" />
        <circle cx="100" cy="30" r="10" fill="#26141a" />
        <rect x="60" y="82" width="80" height="10" rx="4" fill="#26141a" />
        <path d="M136 108c24 0 24 62 0 62" stroke="#26141a" strokeWidth="6" fill="none" />
      </>
    );
  }
  if (n.includes('molinillo')) {
    return (
      <>
        {SHADOW}
        <rect x="58" y="196" width="84" height="26" rx="6" fill="#26141a" />
        <circle cx="100" cy="209" r="4" fill={color} />
        <rect x="68" y="96" width="64" height="104" rx="8" fill={color} />
        <rect x="76" y="108" width="10" height="82" rx="3" fill={LIGHT} />
        <rect x="62" y="86" width="76" height="14" rx="6" fill="#26141a" />
        <path d="M100 86V56h42" stroke="#26141a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M142 56v26" stroke="#26141a" strokeWidth="7" strokeLinecap="round" fill="none" />
        <circle cx="142" cy="86" r="8" fill="#26141a" />
      </>
    );
  }
  if (n.includes('dripper') || n.includes('v60')) {
    return (
      <>
        {SHADOW}
        <rect x="56" y="196" width="88" height="20" rx="5" fill="#26141a" />
        <path d="M40 60h120l-38 122c-2 6-6 8-10 8H88c-4 0-8-2-10-8L40 60Z" fill={color} />
        <path d="M40 60h120" stroke="#26141a" strokeWidth="9" strokeLinecap="round" />
        <path d="M58 80l30 100" stroke={LIGHT} strokeWidth="9" />
      </>
    );
  }
  // Taza por defecto para el resto de accesorios.
  return (
    <>
      {SHADOW}
      <path d="M52 80h88v90a40 40 0 0 1-40 40h-8a40 40 0 0 1-40-40V80Z" fill={color} />
      <path d="M140 100h12a22 22 0 0 1 0 44h-12" stroke={color} strokeWidth="9" fill="none" />
      <path d="M64 96h10v88H64z" fill={LIGHT} />
      <path d="M80 62c-6-8 6-14 0-24M104 62c-6-8 6-14 0-24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".35" />
    </>
  );
}

export default function ProductArt({ product, className = '', title = true }) {
  const { category, color, name, imageUrl, weightG } = product;
  if (imageUrl) {
    return <img src={assetUrl(imageUrl)} alt={title ? name : ''} className={`object-cover ${className}`} loading="lazy" />;
  }
  const kind = category === 'Cold brew' ? 'bottle' : category === 'Cajas' ? 'box' : category === 'Accesorios' ? 'gear' : 'bag';
  return (
    <svg viewBox="0 0 200 240" className={className} role={title ? 'img' : 'presentation'} aria-label={title ? name : undefined}>
      {kind === 'bag' && <Bag color={color} name={name} weight={weightG} />}
      {kind === 'bottle' && <Bottle color={color} name={name} />}
      {kind === 'box' && <Box color={color} name={name} />}
      {kind === 'gear' && <Gear color={color} name={name} />}
    </svg>
  );
}
