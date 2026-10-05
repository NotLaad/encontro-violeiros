import { Topo, Rodape } from '@/components/Topo';
import { createClient } from '@/lib/supabase/server';
import { evento } from '@/lib/evento';
import { linkWhats } from '@/lib/formato';
import { IconeWhats } from '@/components/Icones';
import { CartaoPatrocinador, type Patrocinador } from '@/components/CartaoPatrocinador';

export const revalidate = 300;
export const metadata = { title: 'Patrocinadores' };

export default async function Patrocinadores() {
  const supabase = await createClient();
  const { data: patros } = await supabase.from('patrocinadores').select('*').eq('ativo', true).order('ordem');

  return (
    <>
      <Topo />
      <main style={{ paddingTop: '1.5rem' }}>
        <div className="wrap">
          <div className="secao__cab">
            <div>
              <span className="eyebrow">Patrocinadores</span>
              <h1 className="titulo-pagina">Quem apoia <span className="acento">o Encontro.</span></h1>
            </div>
            <p className="suave">Empresas e irmãos de Pinda e região que ajudam a fazer o {evento.nome} acontecer. Prestigie quem apoia.</p>
          </div>
          {!patros?.length ? (
            <div className="aviso aviso--info">Em breve, os patrocinadores do encontro aparecem aqui.</div>
          ) : (
            <div className="patro-grade">
              {patros.map((p) => <CartaoPatrocinador key={p.id} p={p as Patrocinador} />)}
            </div>
          )}
          <div className="cartao patro-cta">
            <div>
              <h3 style={{ margin: '0 0 .25rem' }}>Quer patrocinar o encontro?</h3>
              <p className="suave">Fale com a organização pelo WhatsApp {evento.whatsappTexto}.</p>
            </div>
            <a className="btn btn--madeira" href={linkWhats(evento.whatsappOrganizacao, `Olá! Tenho interesse em patrocinar o ${evento.nome}.`)} target="_blank" rel="noreferrer">
              <IconeWhats size={20} /> Quero patrocinar
            </a>
          </div>
        </div>
      </main>
      <Rodape />
    </>
  );
}
