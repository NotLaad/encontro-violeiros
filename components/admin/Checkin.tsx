'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { num, hora } from '@/lib/formato';

type Resultado = 'ok' | 'ja_utilizado' | 'nao_pago' | 'nao_encontrado' | 'encontrado';
type Ficha = {
  resultado: Resultado;
  id?: string;
  numero?: number;
  nome?: string;
  tipo?: string;
  status?: string;
  pedido?: number;
  responsavel?: string;
  checkin_em?: string | null;
  checkin_por?: string | null;
};

const CODIGO_VALIDO = /^[0-9a-f]{24}$/;

export function Checkin({ onMudou, versao = 0 }: { onMudou?: () => void; versao?: number } = {}) {
  const supabase = useRef(createClient()).current;
  const leitorRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const travado = useRef(false);
  const [modo, setModo] = useState<'qr' | 'numero'>('qr');
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erro, setErro] = useState('');
  const [numero, setNumero] = useState('');
  const [resumo, setResumo] = useState<{ presentes: number; esperados: number } | null>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);

  const atualizarResumo = useCallback(async () => {
    const { data } = await supabase.rpc('resumo_entrada');
    if (data) setResumo(data);
  }, [supabase]);

  useEffect(() => {
    atualizarResumo();
    const t = setInterval(atualizarResumo, 20000);
    return () => clearInterval(t);
  }, [atualizarResumo, versao]);

  const aoLer = useCallback(
    async (texto: string) => {
      if (travado.current) return;
      travado.current = true;
      leitorRef.current?.pause(true);
      const codigo = texto.trim().toLowerCase();
      if (!CODIGO_VALIDO.test(codigo)) {
        setFicha({ resultado: 'nao_encontrado' });
        vibrar(false);
        return;
      }
      const { data, error } = await supabase.rpc('registrar_entrada', { p_codigo: codigo });
      if (error) setErro(error.message);
      else {
        setFicha(data as Ficha);
        vibrar((data as Ficha).resultado === 'ok');
        atualizarResumo();
        onMudou?.();
      }
    },
    [supabase, atualizarResumo, onMudou],
  );

  // Liga a câmera no modo QR
  useEffect(() => {
    if (modo !== 'qr') return;
    let cancelado = false;
    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelado) return;
      const leitor = new Html5Qrcode('leitor-qr', { verbose: false });
      leitorRef.current = leitor;
      try {
        await leitor.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, aoLer, () => {});
        setCameraAtiva(true);
      } catch {
        setErro('Não foi possível abrir a câmera. Libere o acesso à câmera no navegador ou use a busca por número.');
      }
    })();
    return () => {
      cancelado = true;
      const l = leitorRef.current;
      leitorRef.current = null;
      setCameraAtiva(false);
      if (l?.isScanning) l.stop().then(() => l.clear()).catch(() => {});
    };
  }, [modo, aoLer]);

  function proximo() {
    setFicha(null);
    setErro('');
    setNumero('');
    travado.current = false;
    try {
      leitorRef.current?.resume();
    } catch {}
  }

  async function buscarNumero(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    const n = parseInt(numero.replace(/\D/g, ''), 10);
    if (!n) return;
    const { data, error } = await supabase.rpc('buscar_participante', { p_numero: n });
    if (error) return setErro(error.message);
    setFicha(data as Ficha);
  }

  async function confirmarEntradaManual() {
    if (!ficha?.id) return;
    const { data, error } = await supabase.rpc('registrar_entrada', { p_participante: ficha.id });
    if (error) return setErro(error.message);
    setFicha(data as Ficha);
    vibrar((data as Ficha).resultado === 'ok');
    atualizarResumo();
    onMudou?.();
  }

  return (
    <div className="estreito" style={{ width: 'min(560px, 100%)' }}>
      <div className="contadores">
        <div className="contador">
          <b>{resumo ? resumo.presentes : '–'}</b>
          <span>entraram</span>
        </div>
        <div className="contador">
          <b>{resumo ? resumo.esperados - resumo.presentes : '–'}</b>
          <span>faltam chegar</span>
        </div>
      </div>

      <div className="filtros" role="group" aria-label="Forma de conferir">
        <button className="filtro" aria-pressed={modo === 'qr'} onClick={() => { proximo(); setModo('qr'); }}>Ler QR Code</button>
        <button className="filtro" aria-pressed={modo === 'numero'} onClick={() => { proximo(); setModo('numero'); }}>Digitar número</button>
      </div>

      {modo === 'qr' && (
        <>
          <div id="leitor-qr" className="leitor" style={{ display: ficha ? 'none' : 'block' }} />
          {!cameraAtiva && !erro && !ficha && <p style={{ textAlign: 'center' }}>Abrindo a câmera…</p>}
        </>
      )}

      {modo === 'numero' && !ficha && (
        <form onSubmit={buscarNumero}>
          <div className="campo">
            <label htmlFor="num">Número do ingresso</label>
            <input id="num" inputMode="numeric" autoFocus placeholder="Ex.: 42" value={numero} onChange={(e) => setNumero(e.target.value)} />
            <small>Confira o nome com a pessoa antes de confirmar a entrada.</small>
          </div>
          <button className="btn btn--cheio">Buscar</button>
        </form>
      )}

      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}

      {ficha && <CartaoResultado ficha={ficha} onConfirmar={confirmarEntradaManual} onProximo={proximo} />}
    </div>
  );
}

function CartaoResultado({ ficha, onConfirmar, onProximo }: { ficha: Ficha; onConfirmar: () => void; onProximo: () => void }) {
  const r = ficha.resultado;
  const classe = r === 'ok' ? 'resultado--ok' : r === 'encontrado' ? 'resultado--neutro' : 'resultado--alerta';
  const titulo = {
    ok: 'Entrada liberada',
    encontrado: 'Confira o nome',
    ja_utilizado: 'Ingresso já usado',
    nao_pago: 'Pagamento não confirmado',
    nao_encontrado: 'Ingresso não encontrado',
  }[r];

  return (
    <div className={`resultado ${classe}`} role="status" aria-live="assertive">
      <p className="resultado__titulo">{titulo}</p>
      {ficha.nome && <p className="resultado__nome">{ficha.nome}</p>}
      {ficha.numero && <p>{num(ficha.numero)}, {ficha.tipo}</p>}
      {ficha.responsavel && ficha.responsavel !== ficha.nome && <p>Inscrição de {ficha.responsavel}</p>}
      {r === 'ja_utilizado' && ficha.checkin_em && (
        <p>Entrou às {hora(ficha.checkin_em)}{ficha.checkin_por ? `, liberado por ${ficha.checkin_por}` : ''}.</p>
      )}
      {r === 'encontrado' && ficha.checkin_em && <p>Atenção: já entrou às {hora(ficha.checkin_em)}.</p>}
      {r === 'encontrado' && ficha.status !== 'pago' && <p>Atenção: inscrição {ficha.status}.</p>}
      {r === 'nao_pago' && <p>Situação da inscrição: {ficha.status}. Encaminhe para a mesa da organização.</p>}
      {r === 'nao_encontrado' && <p>Esse código não é de um ingresso do evento.</p>}

      <div className="botoes" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        {r === 'encontrado' && !ficha.checkin_em && ficha.status === 'pago' && (
          <button className="btn btn--milho" onClick={onConfirmar}>Confirmar entrada</button>
        )}
        <button className="btn btn--contorno" onClick={onProximo}>Próximo</button>
      </div>
    </div>
  );
}

function vibrar(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 120 : [80, 60, 80, 60, 80]);
  } catch {}
}
