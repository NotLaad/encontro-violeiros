'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { brl } from '@/lib/formato';

export type Tipo = { id: string; nome: string; preco: number; descricao: string | null; pagante: boolean };
type Pessoa = { nome: string; tipo: string };

export function FormInscricao({ tipos }: { tipos: Tipo[] }) {
  const router = useRouter();
  const [responsavel, setResponsavel] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [pessoas, setPessoas] = useState<Pessoa[]>([{ nome: '', tipo: tipos[0]?.id ?? 'adulto' }]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const precoDe = (id: string) => Number(tipos.find((t) => t.id === id)?.preco ?? 0);
  const total = pessoas.reduce((s, p) => s + precoDe(p.tipo), 0);

  function mudar(i: number, campo: keyof Pessoa, valor: string) {
    setPessoas((l) => l.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)));
  }

  // O primeiro participante acompanha o nome do responsável até ser editado
  function mudarResponsavel(v: string) {
    if (pessoas[0] && (pessoas[0].nome === '' || pessoas[0].nome === responsavel)) mudar(0, 'nome', v);
    setResponsavel(v);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('criar_pedido', {
      p_responsavel: responsavel,
      p_whatsapp: whatsapp,
      p_email: email,
      p_participantes: pessoas,
    });
    if (error || !data?.[0]) {
      setErro(error?.message ?? 'Não foi possível concluir a inscrição. Tente de novo.');
      setEnviando(false);
      return;
    }
    router.push(`/ingresso/${data[0].ret_token}`);
  }

  return (
    <form onSubmit={enviar}>
      <div className="form-bloco">
      <h2>Responsável</h2>
      <div className="campo">
        <label htmlFor="resp">Nome completo</label>
        <input id="resp" required minLength={2} maxLength={120} value={responsavel} onChange={(e) => mudarResponsavel(e.target.value)} autoComplete="name" />
      </div>
      <div className="campo">
        <label htmlFor="whats">WhatsApp</label>
        <input id="whats" type="tel" required inputMode="tel" placeholder="(12) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} autoComplete="tel" />
        <small>É por aqui que você vai receber os ingressos.</small>
      </div>
      <div className="campo">
        <label htmlFor="email">E-mail (opcional)</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>

      </div>

      <div className="form-bloco">
      <h2>Quem vai</h2>
      {pessoas.map((p, i) => (
        <div className="pessoa" key={i}>
          <div className="campo">
            <label htmlFor={`n${i}`}>Nome da pessoa {i + 1}</label>
            <input id={`n${i}`} required minLength={2} maxLength={120} value={p.nome} onChange={(e) => mudar(i, 'nome', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor={`t${i}`}>Ingresso</label>
            <select id={`t${i}`} value={p.tipo} onChange={(e) => mudar(i, 'tipo', e.target.value)}>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({Number(t.preco) === 0 ? 'grátis' : brl(t.preco)})
                </option>
              ))}
            </select>
          </div>
          {pessoas.length > 1 && (
            <button type="button" className="btn btn--perigo btn--peq" onClick={() => setPessoas((l) => l.filter((_, j) => j !== i))}>
              Remover
            </button>
          )}
        </div>
      ))}
      {pessoas.length < 10 && (
        <button type="button" className="btn btn--contorno btn--cheio" onClick={() => setPessoas((l) => [...l, { nome: '', tipo: tipos[0]?.id ?? 'adulto' }])}>
          + Adicionar pessoa
        </button>
      )}
      </div>

      {tipos.filter((t) => t.descricao).map((t) => (
        <p key={t.id} style={{ color: 'var(--tinta-2)', fontSize: '.95rem', margin: '.75rem 0 0' }}>
          <strong>{t.nome}:</strong> {t.descricao}
        </p>
      ))}

      <div className="total">
        <span>Total</span>
        <strong>{brl(total)}</strong>
      </div>

      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}

      <button className="btn btn--cheio" disabled={enviando} style={{ marginTop: '.5rem' }}>
        {enviando ? 'Enviando…' : 'Concluir e ir para o Pix'}
      </button>
    </form>
  );
}
