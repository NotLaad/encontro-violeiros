import { IconeInstagram, IconeLocal, IconeWhats } from './Icones';

export type Patrocinador = {
  id: string;
  nome: string;
  categoria?: string | null;
  cidade?: string | null;
  descricao?: string | null;
  tags?: string[] | null;
  endereco?: string | null;
  maps_url?: string | null;
  logo_url?: string | null;
  cor_fundo?: string | null;
  site?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
};

export function CartaoPatrocinador({ p }: { p: Patrocinador }) {
  const mapa =
    p.maps_url ||
    (p.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.nome} ${p.endereco} ${p.cidade ?? ''}`)}` : null);
  const meta = [p.categoria, p.cidade].filter(Boolean).join(' · ');

  return (
    <article className="patro-card">
      <div className="patro-card__logo" style={{ background: p.cor_fundo || undefined }}>
        {p.logo_url ? (
          <img src={p.logo_url} alt={`Logo ${p.nome}`} loading="lazy" />
        ) : (
          <span className="patro-card__inicial" aria-hidden="true">{p.nome.slice(0, 1)}</span>
        )}
      </div>
      <div className="patro-card__corpo">
        <h3 className="patro-card__nome">{p.nome}</h3>
        {meta && <p className="patro-card__meta">{meta}</p>}
        {p.descricao && <p className="patro-card__desc">{p.descricao}</p>}
        {p.tags && p.tags.length > 0 && (
          <ul className="patro-card__tags" aria-label="Destaques">
            {p.tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        {p.endereco && (
          mapa ? (
            <a className="patro-card__end" href={mapa} target="_blank" rel="noreferrer"><IconeLocal size={18} /> {p.endereco}</a>
          ) : (
            <p className="patro-card__end"><IconeLocal size={18} /> {p.endereco}</p>
          )
        )}
        {(p.instagram || p.whatsapp || p.site) && (
          <div className="patro-card__links">
            {p.instagram && (
              <a href={`https://instagram.com/${p.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label={`Instagram de ${p.nome}`}>
                <IconeInstagram size={20} />
              </a>
            )}
            {p.whatsapp && (
              <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp de ${p.nome}`}>
                <IconeWhats size={20} />
              </a>
            )}
            {p.site && <a href={p.site} target="_blank" rel="noreferrer" className="patro-card__site">Visitar site</a>}
          </div>
        )}
      </div>
    </article>
  );
}
