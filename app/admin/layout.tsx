import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BotaoSair } from '@/components/admin/BotaoSair';
import { AbasAdmin } from '@/components/admin/AbasAdmin';
import { SessaoInativa } from '@/components/admin/SessaoInativa';
import { Marca } from '@/components/Topo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Área da equipe', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: eu } = await supabase.from('admins').select('nome, papel').eq('user_id', user.id).maybeSingle();
  if (!eu) {
    return (
      <main className="login">
        <div className="login__caixa">
          <h1 style={{ fontSize: '1.6rem' }}>Sem acesso</h1>
          <p>Seu usuário ainda não foi liberado para a equipe. Peça para um administrador cadastrar você.</p>
          <BotaoSair />
        </div>
      </main>
    );
  }

  return (
    <>
      <SessaoInativa minutos={30} />
      <header className="adm-topo">
        <div className="wrap">
          <Marca href={eu.papel === 'admin' ? '/admin' : '/admin/checkin'} />
          <nav aria-label="Equipe" style={{ alignItems: 'center' }}>
            <AbasAdmin papel={eu.papel} />
            <BotaoSair />
          </nav>
        </div>
      </header>
      <main className="adm-main">
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}
