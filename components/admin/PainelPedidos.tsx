'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { brl, num, dataHora, hora } from '@/lib/formato';
import { IconeSeta } from '@/components/Icones';

type Status = 'pendente' | 'pago' | 'cancelado';
export type Pedido = {
  id: string;
  numero: number;
  responsavel: string;
  whatsapp: string;
  valor_total: number;
  valor_pix: number;
  status: Status;
  cortesia: boolean;
  criado_em: string;
  ingressos_enviados_em: string | null;
  participantes: { id: string; numero: number; nome: string; tipo: string; checkin_em: string | null }[];
};

export const NOME_TIPO: Record<string, string> = { adulto: 'Adulto', meia: 'Meia', crianca: 'Criança', cortesia: 'Cortesia' };
type Filtro = 'pendente' | 'enviar' | 'pago' | 'cancelado' | 'todos';

export function PainelPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const [filtro, setFiltro] = useState<Filtro>('pendente');
  const [busca, setBusca] = useState('');
  const [abrirCortesia, setAbrirCortesia] = useState(false);
  const router = useRouter();

  const cont = useMemo(() => {
    const pagos = pedidos.filter((p) => p.status === 'pago');
    const pessoas = pagos.flatMap((p) => p.participantes);
    return {
      pendente: pedidos.filter((p) => p.status === 'pendente').length,
      enviar: pagos.filter((p) => !p.ingressos_enviados_em).length,
      pago: pagos.length,
      cancelado: pedidos.filter((p) => p.status === 'cancelado').length,
      todos: pedidos.length,
      pessoas: pessoas.length,
      presentes: pessoas.filter((x) => x.checkin_em).length,
      recebido: pagos.reduce((s, p) => s + Number(p.valor_pix), 0),
    };
  }, [pedidos]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase().replace('#', '');
    const digitos = q.replace(/\D/g, '');
    return pedidos.filter((p) => {
      if (filtro === 'enviar' && !(p.status === 'pago' && !p.ingressos_enviados_em)) return false;
      if (filtro !== 'todos' && filtro !== 'enviar' && p.status !== filtro) return false;
      if (!q) return true;
      return (
        p.responsavel.toLowerCase().includes(q) ||
        (digitos.length >= 4 && p.whatsapp.includes(digitos)) ||
        String(p.numero) === q.replace(/^0+/, '') ||
        p.participantes.some((x) => x.nome.toLowerCase().includes(q) || String(x.numero) === q.replace(/^0+/, ''))
      );
    });
  }, [pedidos, filtro, busca]);

  function baixarLista() {
    const linhas = [['ingresso', 'nome', 'tipo', 'inscricao', 'responsavel', 'whatsapp', 'situacao', 'entrada']];
    pedidos.forEach((p) =>
      p.participantes.forEach((x) =>
        linhas.push([num(x.numero), x.nome, NOME_TIPO[x.tipo] ?? x.tipo, num(p.numero), p.responsavel, p.whatsapp, p.status, x.checkin_em ? hora(x.checkin_em) : '']),
      ),
    );
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participantes-encontro-violeiros.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtros: { id: Filtro; rotulo: string }[] = [
    { id: 'pendente', rotulo: 'Conferir pagamento' },
    { id: 'enviar', rotulo: 'Enviar ingressos' },
    { id: 'pago', rotulo: 'Confirmadas' },
    { id: 'cancelado', rotulo: 'Canceladas' },
    { id: 'todos', rotulo: 'Todas' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <span className="eyebrow" style={{ marginBottom: '.25rem' }}>Área da equipe</span>
          <h1 className="adm-titulo" style={{ margin: 0 }}>Inscrições</h1>
        </div>
        <div className="botoes">
          <button className="btn btn--peq btn--contorno" onClick={() => setAbrirCortesia((v) => !v)}>{abrirCortesia ? 'Fechar cortesia' : 'Criar cortesia'}</button>
          <button className="btn btn--peq btn--contorno" onClick={baixarLista}>Baixar lista</button>
        </div>
      </div>

      <div className="contadores">
        <div className="contador"><b>{cont.pendente}</b><span>para conferir pagamento</span></div>
        <div className="contador"><b>{cont.enviar}</b><span>ingressos para enviar</span></div>
        <div className="contador"><b>{cont.pessoas}</b><span>pessoas confirmadas</span></div>
        <div className="contador"><b>{brl(cont.recebido)}</b><span>recebido</span></div>
      </div>

      {abrirCortesia && <FormCortesia onCriado={() => { setAbrirCortesia(false); setFiltro('enviar'); router.refresh(); }} />}

      <div className="campo">
        <label htmlFor="busca">Buscar</label>
        <input id="busca" type="search" placeholder="Nome, WhatsApp ou número" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="filtros" role="group" aria-label="Filtrar">
        {filtros.map((f) => (
          <button key={f.id} className="filtro" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.rotulo}<small>{cont[f.id]}</small>
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="aviso aviso--info">
          {filtro === 'pendente' ? 'Nenhum pagamento para conferir agora.' : filtro === 'enviar' ? 'Todos os ingressos confirmados já foram enviados.' : 'Nenhuma inscrição encontrada.'}
        </div>
      ) : (
        <div className="pedidos">
          {lista.map((p) => {
            const adultos = p.participantes.filter((x) => x.tipo !== 'crianca').length;
            const criancas = p.participantes.length - adultos;
            const selo = p.cortesia && p.status === 'pago' ? ['pago', 'Cortesia'] : p.status === 'pendente' ? ['pendente', 'Conferir pagamento'] : p.status === 'pago' ? ['pago', p.ingressos_enviados_em ? 'Ingressos enviados' : 'Pago, falta enviar'] : ['cancelado', 'Cancelada'];
            return (
              <Link key={p.id} href={`/admin/inscricao/${p.id}`} className={`pedido pedido--${p.status}`}>
                <div className="pedido__cab">
                  <span className="pedido__resp">{p.responsavel}</span>
                  <span className={`selo selo--${selo[0]}`}>{selo[1]}</span>
                </div>
                <span className="pedido__meta">
                  Inscrição {num(p.numero)}, {dataHora(p.criado_em)}. {adultos} adulto{adultos === 1 ? '' : 's'}{criancas ? `, ${criancas} criança${criancas === 1 ? '' : 's'}` : ''}.
                </span>
                <div className="pedido__rodape">
                  <strong>{p.cortesia ? 'Sem cobrança' : brl(p.valor_pix)}</strong>
                  <span className="pedido__ir">Analisar <IconeSeta size={16} /></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function FormCortesia({ onCriado }: { onCriado: () => void }) {
  const [resp, setResp] = useState('');
  const [whats, setWhats] = useState('');
  const [nomes, setNomes] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const lista = nomes.split('\n').map((n) => n.trim()).filter(Boolean);
    const { error } = await createClient().rpc('criar_cortesia', { p_responsavel: resp, p_whatsapp: whats, p_nomes: lista.length ? lista : [resp] });
    setEnviando(false);
    if (error) return setErro(error.message);
    onCriado();
  }

  return (
    <form onSubmit={criar} className="bloco" style={{ marginBottom: '1.25rem' }}>
      <h2>Nova cortesia</h2>
      <p className="suave" style={{ fontSize: '.9rem' }}>Já entra como confirmada, sem cobrança. Fica registrado quem liberou.</p>
      <div className="campo"><label htmlFor="c-resp">Responsável</label><input id="c-resp" required minLength={2} value={resp} onChange={(e) => setResp(e.target.value)} /></div>
      <div className="campo"><label htmlFor="c-whats">WhatsApp</label><input id="c-whats" type="tel" required value={whats} onChange={(e) => setWhats(e.target.value)} /></div>
      <div className="campo"><label htmlFor="c-nomes">Nomes (um por linha)</label><textarea id="c-nomes" rows={3} value={nomes} onChange={(e) => setNomes(e.target.value)} placeholder="Se deixar vazio, usa o nome do responsável" /></div>
      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
      <button className="btn btn--peq" disabled={enviando}>{enviando ? 'Criando…' : 'Criar cortesia'}</button>
    </form>
  );
}
