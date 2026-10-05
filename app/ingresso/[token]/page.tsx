import QRCode from 'qrcode';
import { notFound } from 'next/navigation';
import { Topo, Rodape } from '@/components/Topo';
import { createClient } from '@/lib/supabase/server';
import { evento } from '@/lib/evento';
import { brl, num, hora, linkWhats } from '@/lib/formato';
import { pixCopiaECola, txidDaInscricao } from '@/lib/pix';
import { IconeWhats, IconeCheck } from '@/components/Icones';
import { AtualizarSozinho } from './AtualizarSozinho';
import { CopiarTexto } from './CopiarChave';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Seu ingresso', robots: { index: false } };

type Participante = { numero: number; nome: string; tipo: string; codigo: string | null; checkin_em: string | null };
type Ingresso = { numero: number; responsavel: string; status: 'pendente' | 'pago' | 'cancelado'; valor_pix: number; cortesia: boolean; participantes: Participante[] };

export default async function PaginaIngresso({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc('ver_ingresso', { p_token: token });
  const ing = data as Ingresso | null;
  if (!ing) notFound();

  return (
    <>
      <Topo />
      <main style={{ paddingTop: '1.5rem' }}>
        {ing.status === 'pendente' && <Pendente ing={ing} />}
        {ing.status === 'cancelado' && (
          <div className="estreito">
            <span className="eyebrow">Inscrição {num(ing.numero)}</span>
            <h1 className="titulo-pagina">Inscrição <span className="acento">cancelada.</span></h1>
            <p>Esta inscrição foi cancelada pela organização. Se acha que é um engano, fale com a gente.</p>
            <a className="btn" href={`https://wa.me/${evento.whatsappOrganizacao}`}>Falar com a organização</a>
          </div>
        )}
        {ing.status === 'pago' && <Pago ing={ing} />}
      </main>
      <Rodape />
    </>
  );
}

async function Pendente({ ing }: { ing: Ingresso }) {
  const valor = Number(ing.valor_pix);
  const codigo = pixCopiaECola({ chave: evento.pix.chave, nome: evento.pix.favorecido, cidade: evento.pix.cidade, valor, txid: txidDaInscricao(ing.numero) });
  const qr = await QRCode.toDataURL(codigo, { margin: 1, width: 480, errorCorrectionLevel: 'M' });
  const msg = `Olá! Segue o comprovante do Pix da inscrição ${num(ing.numero)} (${ing.responsavel}), valor ${brl(valor)}.`;

  return (
    <div className="estreito">
      <AtualizarSozinho segundos={30} />
      <div className="aviso aviso--ok" style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', marginTop: 0 }}>
        <IconeCheck size={22} />
        <span><strong>Inscrição {num(ing.numero)} feita com sucesso!</strong><br />Seu cadastro já está salvo. Agora é só pagar e mandar o comprovante.</span>
      </div>
      <h1 className="titulo-pagina">Falta só <span className="acento">o Pix.</span></h1>

      <ol className="passos" style={{ gridTemplateColumns: '1fr', marginBottom: '1.25rem' }}>
        <li className="passo"><span className="passo__n">01</span><strong>Pague o Pix abaixo</strong><span>Valor exato de {brl(valor)}.</span></li>
        <li className="passo"><span className="passo__n">02</span><strong>Envie o comprovante</strong><span>Pelo botão do WhatsApp, logo depois do Pix.</span></li>
        <li className="passo"><span className="passo__n">03</span><strong>Seus ingressos aparecem aqui</strong><span>Assim que a organização conferir, os QR Codes surgem nesta mesma tela. Ela se atualiza sozinha e você também recebe o link no WhatsApp.</span></li>
      </ol>

      <div className="pix">
        <div>
          <span className="info__rotulo">Valor a pagar</span>
          <div className="pix__valor">{brl(valor)}</div>
        </div>
        <img className="pix__qr" src={qr} alt="QR Code do Pix" width={240} height={240} />
        <p style={{ margin: 0, fontSize: '.92rem' }} className="suave">
          No app do banco, escolha <strong>Pix &gt; Pagar com QR Code</strong>. Se estiver no celular, use o <strong>Pix Copia e Cola</strong>:
        </p>
        <div className="pix__copia">
          <code>{codigo}</code>
          <CopiarTexto texto={codigo} rotulo="Copiar código Pix" />
        </div>
        <div className="pix__dados">
          <span>Favorecido: <strong>{evento.pix.favorecido}</strong> ({evento.pix.banco})</span>
          <span>Identificação: <strong>{txidDaInscricao(ing.numero)}</strong></span>
        </div>
      </div>

      <div className="form-bloco">
        <h2>Já pagou?</h2>
        <p>Envie o comprovante e aguarde nesta tela. Seus ingressos com QR Code vão aparecer aqui quando a organização confirmar.</p>
        <a className="btn btn--cheio" href={linkWhats(evento.whatsappOrganizacao, msg)}><IconeWhats size={20} /> Enviar comprovante no WhatsApp</a>
        <p className="suave" style={{ fontSize: '.85rem', marginTop: '.75rem' }}>Dica: salve este link nos favoritos para voltar depois.</p>
      </div>

      <div className="form-bloco">
        <h2>Pessoas nesta inscrição</h2>
        <ul className="lista-pessoas">
          {ing.participantes.map((p, i) => (
            <li key={i}><span className="n">{String(i + 1).padStart(2, '0')}</span><span>{p.nome}</span><span className="t">{p.tipo}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

async function Pago({ ing }: { ing: Ingresso }) {
  const qrs = await Promise.all(
    ing.participantes.map((p) => QRCode.toDataURL(p.codigo ?? '', { margin: 1, width: 480, errorCorrectionLevel: 'M' })),
  );
  return (
    <div className="wrap">
      <div className="centro" style={{ marginBottom: '2rem' }}>
        <span className="eyebrow">Inscrição {num(ing.numero)} confirmada</span>
        <h1 className="titulo-pagina">Seus <span className="acento">ingressos.</span></h1>
        <p className="suave">{evento.data}, {evento.horarioLongo}, no {evento.local}. Na entrada, mostre o QR Code de cada pessoa ou fale o número do ingresso.</p>
        <p className="suave" style={{ fontSize: '.9rem' }}>Dica: tire um print desta tela para ter os ingressos mesmo sem internet.</p>
      </div>
      <div className="ingressos">
        {ing.participantes.map((p, i) => (
          <article key={p.numero} className={`ingresso ${p.checkin_em ? 'ingresso--usado' : ''}`}>
            <div className="ingresso__topo tabua">
              <span className="ingresso__marca">Encontro de<br /><em>Violeiros</em></span>
              <span className="ingresso__num">{num(p.numero)}</span>
            </div>
            <div className="ingresso__corpo">
              <img src={qrs[i]} alt={`QR Code do ingresso ${num(p.numero)}`} />
              <div className="ingresso__nome">{p.nome}</div>
              <div className="ingresso__tipo">{p.tipo}, {evento.dataCurta}, {evento.horario}</div>
              {p.checkin_em && <span className="selo selo--entrou">Entrada registrada às {hora(p.checkin_em)}</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
