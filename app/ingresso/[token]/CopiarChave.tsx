'use client';

import { useState } from 'react';
import { IconeCheck, IconeCopiar } from '@/components/Icones';

export function CopiarTexto({ texto, rotulo = 'Copiar', classe = 'btn btn--cheio' }: { texto: string; rotulo?: string; classe?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={classe}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2500);
        } catch {}
      }}
    >
      {copiado ? <><IconeCheck size={20} /> Copiado</> : <><IconeCopiar size={20} /> {rotulo}</>}
    </button>
  );
}
