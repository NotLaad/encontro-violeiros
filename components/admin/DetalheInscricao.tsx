'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { evento } from '@/lib/evento';
import { brl, num, dataHora, hora, linkWhats } from '@/lib/formato';
import { txidDaInscricao } from '@/lib/pix';
import { IconeSeta, IconeWhats, IconeCheck } from '@/components/Icones';
import { NOME_TIPO } from './PainelPedidos';

export type PedidoDetalhe = {
  id: string;
  numero: number;
  responsavel: string;
  whatsapp: string;
  email: string | null;
  valor_total: number;
  valor_pix: number;
  status: 'pendente' | 'pago' | 'cancelado';
  cortesia: boolean;
  token: string;
  criado_em: string;
  confirmado_em: string | null;
  cancelado_em: string | null;
  ingressos_enviados_em: string | null;
  observacao: string | null;
  confirmador: { nome: string } | null;
  cancelador: { nome: string } | null;
  participantes: { id: string; numero: number; nome: string; tipo: string; codigo: string; checkin_em: string | null }[];
};

const formatarWhats = (w: string) => {
  const d = w.replace(/^55/, '');
  return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : w;
};

export function DetalheInscricao({ pedido: p, qrs }: { pedido: PedidoDetalhe; qrs: string[] }) {
  const router = useRouter();
  const [conferido, setConferido] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const primeiroNome = p.responsavel.split(' ')[0];
  const linkIngressos = `${evento.siteUrl}/ingresso/${p.token}`;

  const mensagem =
    `Olá, ${primeiroNome}! ` +
    (p.cortesia ? 'Aqui estão os seus ingressos' : 'Seu pagamento foi confirmado. Aqui estão os seus ingressos') +
    ` para o ${evento.nome}:\n\n` +
    p.participantes.map((x) => `${num(x.numero)}  ${x.nome} (${NOME_TIPO[x.tipo] ?? x.tipo})`).join('\n') +
    `\n\nAbra o link para ver o QR Code de cada pessoa:\n${linkIngressos}\n\n${evento.data}, ${evento.horarioLongo}, no ${evento.local}.`;

  async function executar(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setErro('');
    setOcupado(true);
    const { error } = await fn();
    setOcupado(false);
    if (error) setErro(error.message);
    router.refresh();
  }

  const confirmar = () => executar(() => createClient().rpc('confirmar_pagamento', { p_pedido: p.id }));
  const cancelar = () => {
    const motivo = prompt(`Cancelar a inscrição ${num(p.numero)} de ${p.responsavel}? Os ingressos deixam de valer.\n\nMotivo (opcional):`);
    if (motivo === null) return;
    executar(() => createClient().rpc('cancelar_pedido', { p_pedido: p.id, p_motivo: motivo || null }));
  };
  const enviar = async () => {
    window.open(linkWhats(p.whatsapp, mensagem), '_blank', 'noopener');
    await createClient().rpc('marcar_envio', { p_pedido: p.id });
    router.refresh();
  };
  const copiar = async () => {
    try { await navigator.clipboard.writeText(mensagem); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch {}
  };

  const selo =
    p.status === 'pendente' ? ['pendente', 'Conferir pagamento'] :
    p.status === 'cancelado' ? ['cancelado', 'Cancelada'] :
    p.ingressos_enviados_em ? ['pago', 'Ingressos enviados'] : ['pago', p.cortesia ? 'Cortesia, falta enviar' : 'Pago, falta enviar'];

  return (
    <>
      <Link href="/admin" className="voltar"><IconeSeta dir="esq" size={18} /> Inscrições</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <span className="eyebrow" style={{ marginBottom: '.25rem' }}>Inscrição {num(p.numero)}</span>
          <h1 className="adm-titulo" style={{ margin: 0 }}>{p.responsavel}</h1>
        </div>
        <span className={`selo selo--${selo[0]}`}>{selo[1]}</span>
      </div>

      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}

      <div className="detalhe">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <section className="bloco">
            <h2>Responsável</h2>
            <dl className="dados">
              <div><dt>Nome</dt><dd>{p.responsavel}</dd></div>
              <div><dt>WhatsApp</dt><dd>{formatarWhats(p.whatsapp)} <a href={linkWhats(p.whatsapp, `Olá, ${primeiroNome}!`)} target="_blank" rel="noreferrer" style={{ fontWeight: 700, marginLeft: '.35rem' }}>Abrir conversa</a></dd></div>
              <div><dt>E-mail</dt><dd>{p.email || 'Não informado'}</dd></div>
              <div><dt>Inscrita em</dt><dd>{dataHora(p.criado_em)}</dd></div>
            </dl>
          </section>

          <section className="bloco">
            <h2>Participantes ({p.participantes.length})</h2>
            <ul className="lista-pessoas">
              {p.participantes.map((x) => (
                <li key={x.id}>
                  <span className="n">{num(x.numero)}</span>
                  <span><strong>{x.nome}</strong><br /><span className="t">{NOME_TIPO[x.tipo] ?? x.tipo}</span></span>
                  {x.checkin_em ? <span className="selo selo--entrou">Entrou {hora(x.checkin_em)}</span> : <span className="t">{p.status === 'pago' ? 'Não chegou' : ''}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {p.status === 'pendente' && (
            <section className="bloco">
              <h2>Conferir pagamento</h2>
              <span className="info__rotulo">Valor esperado no Pix</span>
              <div className="valor-grande">{brl(p.valor_pix)}</div>
              <dl className="dados" style={{ marginBottom: '.25rem' }}>
                <div><dt>Identificação</dt><dd>{txidDaInscricao(p.numero)}</dd></div>
                <div><dt>Pagador</dt><dd>Normalmente {p.responsavel}</dd></div>
              </dl>
              <label className="conferir">
                <input type="checkbox" checked={conferido} onChange={(e) => setConferido(e.target.checked)} />
                <span>Conferi no extrato ou no comprovante: <strong>{brl(p.valor_pix)}</strong> recebido para esta inscrição.</span>
              </label>
              <div style={{ display: 'grid', gap: '.5rem' }}>
                <button className="btn btn--cheio" disabled={!conferido || ocupado} onClick={confirmar}>
                  <IconeCheck size={20} /> Confirmar pagamento e gerar ingressos
                </button>
                <a className="btn btn--contorno btn--cheio" target="_blank" rel="noreferrer"
                  href={linkWhats(p.whatsapp, `Olá, ${primeiroNome}! Sua inscrição ${num(p.numero)} no ${evento.nome} está aguardando o Pix de ${brl(p.valor_pix)}. O QR Code do Pix está aqui: ${linkIngressos}`)}>
                  <IconeWhats size={20} /> Lembrar do Pix
                </a>
              </div>
            </section>
          )}

          {p.status === 'pago' && (
            <section className="bloco">
              <h2>{p.ingressos_enviados_em ? 'Ingressos enviados' : 'Enviar ingressos'}</h2>
              <p className="suave" style={{ fontSize: '.92rem' }}>Cada pessoa tem um número e um QR Code próprios. A mensagem vai com o link da página dos ingressos.</p>
              <div className="envio-qrs">
                {p.participantes.map((x, i) => (
                  <div className="envio-qr" key={x.id}>
                    {qrs[i] && <img src={qrs[i]} alt={`QR Code do ingresso ${num(x.numero)}`} />}
                    <strong>{num(x.numero)}</strong>
                    {x.nome.split(' ')[0]}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gap: '.5rem' }}>
                <button className="btn btn--cheio" onClick={enviar}><IconeWhats size={20} /> {p.ingressos_enviados_em ? 'Enviar de novo no WhatsApp' : 'Enviar ingressos no WhatsApp'}</button>
                <button className="btn btn--contorno btn--cheio" onClick={copiar}>{copiado ? 'Mensagem copiada' : 'Copiar mensagem'}</button>
                <a className="btn btn--contorno btn--cheio" href={`/ingresso/${p.token}`} target="_blank" rel="noreferrer">Ver página dos ingressos</a>
              </div>
            </section>
          )}

          <section className="bloco">
            <h2>Histórico</h2>
            <ul className="linha-tempo">
              <li><span>Inscrição feita <span className="suave">em {dataHora(p.criado_em)}</span></span></li>
              {p.confirmado_em && <li><span>{p.cortesia ? 'Cortesia liberada' : 'Pagamento confirmado'} por <strong>{p.confirmador?.nome ?? 'equipe'}</strong> <span className="suave">em {dataHora(p.confirmado_em)}</span></span></li>}
              {p.ingressos_enviados_em && <li><span>Ingressos enviados <span className="suave">em {dataHora(p.ingressos_enviados_em)}</span></span></li>}
              {p.cancelado_em && <li className="cancel"><span>Cancelada por <strong>{p.cancelador?.nome ?? 'equipe'}</strong> <span className="suave">em {dataHora(p.cancelado_em)}{p.observacao ? `: ${p.observacao}` : ''}</span></span></li>}
            </ul>
          </section>

          {p.status !== 'cancelado' && (
            <button className="btn btn--perigo btn--cheio" disabled={ocupado} onClick={cancelar}>Cancelar inscrição</button>
          )}
        </div>
      </div>
    </>
  );
}
