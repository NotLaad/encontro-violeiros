'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { IconeEscudo, IconeViolaoMarca } from '@/components/Icones';

const LIMITE = 5;          // tentativas
const BLOQUEIO_MIN = 10;   // minutos de espera depois do limite

type Registro = { n: number; ate: number };
function lerTentativas(): Registro {
  try { return JSON.parse(localStorage.getItem('equipe-tentativas') || '') as Registro; } catch { return { n: 0, ate: 0 }; }
}
function salvarTentativas(r: Registro) {
  try { localStorage.setItem('equipe-tentativas', JSON.stringify(r)); } catch {}
}

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    const tick = () => setEspera(Math.max(0, Math.ceil((lerTentativas().ate - Date.now()) / 60000)));
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (espera > 0) return;
    setErro('');
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      const n = lerTentativas().n + 1;
      const bloqueia = n >= LIMITE;
      salvarTentativas({ n: bloqueia ? 0 : n, ate: bloqueia ? Date.now() + BLOQUEIO_MIN * 60000 : 0 });
      if (bloqueia) setEspera(BLOQUEIO_MIN);
      setErro(bloqueia ? `Muitas tentativas. Aguarde ${BLOQUEIO_MIN} minutos para tentar de novo.` : `E-mail ou senha incorretos. Restam ${LIMITE - n} tentativas.`);
      return;
    }
    salvarTentativas({ n: 0, ate: 0 });
    await supabase.from('acessos').insert({ evento: 'login' });
    router.replace('/admin');
    router.refresh();
  }

  return (
    <main className="login">
      <form className="login__caixa" onSubmit={entrar}>
        <div className="login__cab">
          <span className="marca"><span className="marca__icone"><IconeViolaoMarca size={22} /></span><span className="marca__texto"><span className="marca__nome">Encontro de <em>Violeiros</em></span><span className="marca__sub">Área da equipe</span></span></span>
          <h1>Entrar</h1>
        </div>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <div className="senha-campo">
            <input id="senha" type={verSenha ? 'text' : 'password'} required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <button type="button" onClick={() => setVerSenha((v) => !v)} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}>{verSenha ? 'Esconder' : 'Mostrar'}</button>
          </div>
        </div>
        {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
        <button className="btn btn--cheio" disabled={enviando || espera > 0}>
          {espera > 0 ? `Aguarde ${espera} min` : enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <div className="login__seguro">
          <IconeEscudo size={18} />
          <span>Acesso restrito à organização. Todos os acessos ficam registrados. Esqueceu a senha? Peça a um administrador para redefinir.</span>
        </div>
      </form>
    </main>
  );
}
