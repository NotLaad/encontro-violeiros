import Link from 'next/link';
import { evento } from '@/lib/evento';
import { IconeInstagram, IconeWhats, IconeLocal, IconeViolaoMarca } from './Icones';

export function Marca({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="marca" aria-label={`${evento.nome}, página inicial`}>
      <span className="marca__icone"><IconeViolaoMarca size={22} /></span>
      <span className="marca__texto">
        <span className="marca__nome">Encontro de <em>Violeiros</em></span>
        <span className="marca__sub">{evento.cidade}</span>
      </span>
    </Link>
  );
}

export function Topo({ semBotao = false }: { semBotao?: boolean }) {
  return (
    <header className="topo">
      <div className="wrap topo__capsula">
        <Marca />
        <nav aria-label="Principal">
          <Link href="/#encontro" className="topo__link">O encontro</Link>
          <Link href="/#ingressos" className="topo__link">Ingressos</Link>
          <Link href="/#patrocinadores" className="topo__link">Patrocinadores</Link>
          {!semBotao && <Link href="/inscricao" className="btn btn--peq">Inscrever-se</Link>}
        </nav>
      </div>
    </header>
  );
}

export function Rodape() {
  return (
    <footer className="rodape tabua">
      <div className="wrap rodape__grade">
        <div>
          <span className="marca">
            <span className="marca__icone"><IconeViolaoMarca size={22} furo="#f7ead0" /></span>
            <span className="marca__texto">
              <span className="marca__nome">Encontro de <em>Violeiros</em></span>
              <span className="marca__sub">{evento.cidade}</span>
            </span>
          </span>
          <p style={{ margin: '1rem 0 0' }}>
            {evento.data}, {evento.horarioLongo}<br />
            {evento.local}
          </p>
        </div>
        <div className="rodape__links">
          <a href={evento.mapsUrl} target="_blank" rel="noreferrer"><IconeLocal size={20} /> Como chegar</a>
          <a href={`https://instagram.com/${evento.instagram}`} target="_blank" rel="noreferrer"><IconeInstagram size={20} /> @{evento.instagram}</a>
          <a href={`https://wa.me/${evento.whatsappOrganizacao}`} target="_blank" rel="noreferrer"><IconeWhats size={20} /> {evento.whatsappTexto}</a>
        </div>
      </div>
    </footer>
  );
}
