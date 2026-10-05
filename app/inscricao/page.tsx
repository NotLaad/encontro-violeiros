import { Topo, Rodape } from '@/components/Topo';
import { createClient } from '@/lib/supabase/server';
import { FormInscricao, type Tipo } from './FormInscricao';
import { evento } from '@/lib/evento';

export const metadata = { title: 'Inscrição' };
export const revalidate = 300;

export default async function Inscricao() {
  const supabase = await createClient();
  const { data } = await supabase.from('tipos_ingresso').select('*').eq('publico', true).order('ordem');

  return (
    <>
      <Topo semBotao />
      <main style={{ paddingTop: '1.5rem' }}>
        <div className="estreito">
          <span className="eyebrow">{evento.dataCurta}, {evento.horarioLongo}</span>
          <h1 className="titulo-pagina">Faça sua <span className="acento">inscrição.</span></h1>
          <p>Inscreva você e quem vai junto. Depois é só pagar pelo Pix e mandar o comprovante. Quando a organização confirmar, você recebe os ingressos no WhatsApp.</p>
          <FormInscricao tipos={(data ?? []) as Tipo[]} />
        </div>
      </main>
      <Rodape />
    </>
  );
}
