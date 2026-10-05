'use client';

import { createClient } from '@/lib/supabase/client';

export function BotaoSair() {
  return (
    <button
      type="button"
      className="btn btn--peq btn--contorno"
      onClick={async () => {
        const supabase = createClient();
        await supabase.from('acessos').insert({ evento: 'saida' });
        await supabase.auth.signOut();
        window.location.replace('/entrar');
      }}
    >
      Sair
    </button>
  );
}
