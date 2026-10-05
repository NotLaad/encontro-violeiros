type P = { size?: number };
const base = (size = 22) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
});

export const IconeData = ({ size }: P) => (
  <svg {...base(size)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M8 14h2M14 14h2M8 17h2" /></svg>
);
export const IconeHora = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconeIngresso = ({ size }: P) => (
  <svg {...base(size)}><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" /><path d="M14 6v12" strokeDasharray="2 2" /></svg>
);
export const IconeLocal = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const IconeInstagram = ({ size }: P) => (
  <svg {...base(size)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg>
);
export const IconeWhats = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1Z" /><path d="M9 9.5c.3 2.4 2.2 4.3 4.6 4.6l1-1.2 2 1-.4 1.6c-3.8.2-7.2-3.2-7-7l1.6-.4 1 2Z" /></svg>
);
export const IconeViolao = ({ size }: P) => (
  <svg {...base(size)}><path d="M20 4l-6.5 6.5" /><path d="M18 2l4 4" /><circle cx="8" cy="16" r="1.2" /><path d="M13.5 10.5c-1.2-1-3-.8-4 .3-.6.6-.8 1.4-.7 2.2-1.3-.4-2.9 0-3.9 1-1.9 1.9-1.6 5 .6 6.9 1.9 1.7 4.8 1.7 6.4-.1 1-1 1.3-2.5 1-3.8.8.1 1.6-.2 2.2-.8 1.1-1 1.2-2.8.3-4" /></svg>
);

/** Violão (marca do encontro). Preenchido, usa currentColor; o furo acompanha `furo`. */
export const IconeViolaoMarca = ({ size = 22, furo = '#2f5130' }: { size?: number; furo?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11.2 12.8 19.6 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M18.4 2.9l2.7 2.7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="10.2" cy="13.8" r="3.3" fill="currentColor" />
    <circle cx="7" cy="17" r="4.4" fill="currentColor" />
    <circle cx="8.9" cy="15.1" r="1.25" fill={furo} />
    <path d="M4.9 19.1l2.1-2.1" stroke={furo} strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);
export const IconeCadeado = ({ size }: P) => (
  <svg {...base(size)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconeEscudo = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6Z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const IconeSeta = ({ size, dir = 'dir' }: P & { dir?: 'dir' | 'esq' }) => (
  <svg {...base(size)}>{dir === 'dir' ? <path d="M9 5l7 7-7 7" /> : <path d="M15 5l-7 7 7 7" />}</svg>
);
export const IconeCopiar = ({ size }: P) => (
  <svg {...base(size)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
);
export const IconeCheck = ({ size }: P) => (
  <svg {...base(size)}><path d="M5 12l5 5 9-10" /></svg>
);
