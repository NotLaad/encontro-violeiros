'use client';

import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { num, hora } from '@/lib/formato';

type Pessoa = {
  id: string; numero: number; nome: string; tipo: string; codigo: string;
  pedido: number; responsavel: string; checkin_em: string | null; checkin_por: string | null;
};
type Filtro = 'todos' | 'entraram' | 'faltam';

export function ListaPresenca({ versao, onMudou }: { versao: number; onMudou: () => void }) {
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [aberto, setAberto] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await createClient().rpc('lista_presenca');
    if (error) return setErro(error.message);
    setErro('');
    setPessoas((data ?? []) as Pessoa[]);
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 20000); // mostra entradas feitas em outros celulares
    return () => clearInterval(t);
  }, [carregar, versao]);

  useEffect(() => {
    const p = pessoas?.find((x) => x.id === aberto);
    if (!p) return setQr('');
    QRCode.toDataURL(p.codigo, { margin: 1, width: 360 }).then(setQr).catch(() => setQr(''));
  }, [aberto, pessoas]);

  const cont = useMemo(() => {
    const l = pessoas ?? [];
    const entraram = l.filter((p) => p.checkin_em).length;
    return { todos: l.length, entraram, faltam: l.length - entraram };
  }, [pessoas]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase().replace('#', '');
    const n = q.replace(/^0+/, '');
    return (pessoas ?? [])
      .filter((p) => (filtro === 'entraram' ? p.checkin_em : filtro === 'faltam' ? !p.checkin_em : true))
      .filter((p) => !q || p.nome.toLowerCase().includes(q) || p.responsavel.toLowerCase().includes(q) || String(p.numero) === n)
      .sort((a, b) =>
        filtro === 'entraram' && a.checkin_em && b.checkin_em ? b.checkin_em.localeCompare(a.checkin_em) : a.nome.localeCompare(b.nome, 'pt-BR'),
      );
  }, [pessoas, busca, filtro]);

  async function confirmar(p: Pessoa) {
    if (!confirm(`Confirmar a entrada de ${p.nome} (${num(p.numero)})?`)) return;
    setOcupado(p.id);
    const { error } = await createClient().rpc('registrar_entrada', { p_participante: p.id });
    setOcupado(null);
    if (error) return setErro(error.message);
    onMudou();
  }

  return (
    <section className="presenca" aria-label="Lista de presença">
      <div className="presenca__cab">
        <h2>Lista de presença</h2>
        <span className="suave" style={{ fontSize: '.85rem' }}>Atualiza sozinha</span>
      </div>
      <div className="campo" style={{ marginBottom: '.6rem' }}>
        <label htmlFor="busca-presenca" className="sr">Buscar</label>
        <input id="busca-presenca" type="search" placeholder="Buscar por nome ou número" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <div className="filtros" role="group" aria-label="Filtrar presença">
        <button className="filtro" aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos<small>{cont.todos}</small></button>
        <button className="filtro" aria-pressed={filtro === 'entraram'} onClick={() => setFiltro('entraram')}>Já entraram<small>{cont.entraram}</small></button>
        <button className="filtro" aria-pressed={filtro === 'faltam'} onClick={() => setFiltro('faltam')}>Faltam chegar<small>{cont.faltam}</small></button>
      </div>

      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
      {pessoas === null ? (
        <p className="suave">Carregando lista…</p>
      ) : lista.length === 0 ? (
        <div className="aviso aviso--info">{busca ? 'Ninguém encontrado com essa busca.' : filtro === 'entraram' ? 'Ninguém entrou ainda.' : 'Nenhuma pessoa nesta lista.'}</div>
      ) : (
        <ul className="presenca__lista">
          {lista.map((p) => (
            <li key={p.id} className={`presente ${p.checkin_em ? 'presente--ok' : ''}`}>
              <div className="presente__linha">
                <div style={{ minWidth: 0 }}>
                  {p.checkin_em ? (
                    <span className="selo selo--pago">Confirmado às {hora(p.checkin_em)}{p.checkin_por ? `, por ${p.checkin_por}` : ''}</span>
                  ) : (
                    <span className="selo selo--pendente">Aguardando chegada</span>
                  )}
                  <div className="presente__nome">{p.nome}</div>
                  <div className="presente__meta">
                    <strong className="presente__num">{num(p.numero)}</strong> {p.tipo}, inscrição de {p.responsavel}
                  </div>
                </div>
                <button type="button" className="presente__qrbtn" onClick={() => setAberto(aberto === p.id ? null : p.id)} aria-expanded={aberto === p.id}>
                  {aberto === p.id ? 'Fechar' : 'Ver QR'}
                </button>
              </div>
              {aberto === p.id && (
                <div className="presente__qr">
                  {qr ? <img src={qr} alt={`QR Code do ingresso ${num(p.numero)}`} /> : <span className="suave">Gerando…</span>}
                  <span>Código {num(p.numero)}</span>
                </div>
              )}
              {!p.checkin_em && (
                <button type="button" className="btn btn--peq btn--contorno" style={{ marginTop: '.5rem' }} disabled={ocupado === p.id} onClick={() => confirmar(p)}>
                  Confirmar entrada
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
