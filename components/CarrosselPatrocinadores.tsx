'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CartaoPatrocinador, type Patrocinador } from './CartaoPatrocinador';
import { IconeSeta } from './Icones';

export function CarrosselPatrocinadores({ patros }: { patros: Patrocinador[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [paginas, setPaginas] = useState(patros.length);

  const medidas = useCallback(() => {
    const t = trilho.current;
    const item = t?.firstElementChild as HTMLElement | null;
    if (!t || !item) return null;
    const gap = parseFloat(getComputedStyle(t).columnGap || '0') || 0;
    const passo = item.offsetWidth + gap;
    const porTela = Math.max(1, Math.round((t.clientWidth + gap) / passo));
    return { t, passo, total: Math.max(1, patros.length - porTela + 1) };
  }, [patros.length]);

  const atualizar = useCallback(() => {
    const m = medidas();
    if (!m) return;
    setPaginas(m.total);
    setAtual(Math.min(m.total - 1, Math.round(m.t.scrollLeft / m.passo)));
  }, [medidas]);

  useEffect(() => {
    atualizar();
    window.addEventListener('resize', atualizar);
    return () => window.removeEventListener('resize', atualizar);
  }, [atualizar]);

  function irPara(i: number) {
    const m = medidas();
    if (!m) return;
    const destino = ((i % m.total) + m.total) % m.total; // no fim, volta para o primeiro
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    m.t.scrollTo({ left: destino * m.passo, behavior: suave ? 'smooth' : 'auto' });
  }

  // Tocar no cartão (fora de links) avança para o próximo
  function aoTocar(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('a, button')) return;
    irPara(atual + 1);
  }

  if (patros.length === 0) return null;

  return (
    <div className="carrossel" role="region" aria-roledescription="carrossel" aria-label="Patrocinadores">
      <div className="carrossel__trilho" ref={trilho} onScroll={atualizar}>
        {patros.map((p, i) => (
          <div className="carrossel__item" key={p.id} onClick={aoTocar} aria-roledescription="slide" aria-label={`${i + 1} de ${patros.length}`}>
            <CartaoPatrocinador p={p} />
          </div>
        ))}
      </div>

      {paginas > 1 && (
        <div className="carrossel__nav">
          <div className="carrossel__pontos">
            {Array.from({ length: paginas }).map((_, i) => (
              <button key={i} type="button" className="carrossel__ponto" aria-label={`Ir para o ${i + 1}º`} aria-current={i === atual} onClick={() => irPara(i)} />
            ))}
          </div>
          <div className="carrossel__setas">
            <button type="button" className="carrossel__seta" onClick={() => irPara(atual - 1)} aria-label="Patrocinador anterior"><IconeSeta dir="esq" /></button>
            <button type="button" className="carrossel__seta" onClick={() => irPara(atual + 1)} aria-label="Próximo patrocinador"><IconeSeta /></button>
          </div>
        </div>
      )}
    </div>
  );
}
