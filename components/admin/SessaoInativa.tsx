'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Sai sozinho depois de X minutos sem uso (celular esquecido na mesa, por exemplo). */
export function SessaoInativa({ minutos }: { minutos: number }) {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const sair = async () => {
      await createClient().auth.signOut();
      window.location.replace('/entrar');
    };
    const reiniciar = () => { clearTimeout(t); t = setTimeout(sair, minutos * 60000); };
    const eventos = ['pointerdown', 'keydown', 'scroll', 'visibilitychange'];
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    reiniciar();
    return () => { clearTimeout(t); eventos.forEach((e) => window.removeEventListener(e, reiniciar)); };
  }, [minutos]);
  return null;
}
