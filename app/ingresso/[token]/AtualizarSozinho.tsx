'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Recarrega os dados da página de tempos em tempos: quando o pagamento é confirmado, os ingressos aparecem sozinhos. */
export function AtualizarSozinho({ segundos }: { segundos: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') router.refresh(); }, segundos * 1000);
    const aoVoltar = () => { if (document.visibilityState === 'visible') router.refresh(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', aoVoltar); };
  }, [router, segundos]);
  return null;
}
