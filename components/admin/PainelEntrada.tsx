'use client';

import { useCallback, useState } from 'react';
import { Checkin } from './Checkin';
import { ListaPresenca } from './ListaPresenca';

export function PainelEntrada() {
  const [versao, setVersao] = useState(0);
  const mudou = useCallback(() => setVersao((v) => v + 1), []);
  return (
    <div className="entrada-grade">
      <div className="entrada-leitor"><Checkin onMudou={mudou} versao={versao} /></div>
      <ListaPresenca versao={versao} onMudou={mudou} />
    </div>
  );
}
