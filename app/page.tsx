import Link from 'next/link';
import { Topo, Rodape } from '@/components/Topo';
import { IconeData, IconeHora, IconeIngresso, IconeLocal, IconeWhats, IconeViolaoMarca } from '@/components/Icones';
import { evento } from '@/lib/evento';
import { brl, linkWhats } from '@/lib/formato';
import { createClient } from '@/lib/supabase/server';
import { type Patrocinador } from '@/components/CartaoPatrocinador';
import { CarrosselPatrocinadores } from '@/components/CarrosselPatrocinadores';

export const revalidate = 300;

export default async function Inicio() {
  const supabase = await createClient();
  const [{ data: tipos }, { data: patros }] = await Promise.all([
    supabase.from('tipos_ingresso').select('*').eq('publico', true).order('ordem'),
    supabase.from('patrocinadores').select('*').eq('ativo', true).order('ordem'),
  ]);

  const convidar = `${evento.nome} em ${evento.cidade}! ${evento.dataCurta}, ${evento.horarioLongo}, no ${evento.local}. Garanta seu ingresso: ${evento.siteUrl}`;

  return (
    <div className="com-barra">
      <Topo />

      <section className="hero">
        <div className="wrap hero__grade">
          <div>
            <span className="hero__eyebrow"><i><IconeViolaoMarca size={15} furo="#e4ecdc" /></i>{evento.cidade}, {evento.dataCurta}</span>
            <h1 className="hero__titulo">
              Encontro de <span className="acento">Violeiros.</span>
            </h1>
            <p className="hero__texto">{evento.chamada}</p>

            <div className="infos">
              <div className="info">
                <span className="info__icone"><IconeData size={20} /></span>
                <span><span className="info__rotulo">Data</span><span className="info__valor">{evento.dataCurta}</span></span>
              </div>
              <div className="info">
                <span className="info__icone"><IconeHora size={20} /></span>
                <span><span className="info__rotulo">A partir das</span><span className="info__valor">{evento.horario}</span></span>
              </div>
              <div className="info">
                <span className="info__icone"><IconeIngresso size={20} /></span>
                <span><span className="info__rotulo">Ingresso</span><span className="info__valor">{evento.valorTexto}</span></span>
              </div>
              <div className="info">
                <span className="info__icone"><IconeViolaoMarca size={20} furo="#e4ecdc" /></span>
                <span><span className="info__rotulo">Criança (até 6)</span><span className="info__valor">Grátis</span></span>
              </div>
              <div className="info info--largo">
                <span className="info__icone"><IconeLocal size={20} /></span>
                <span>
                  <span className="info__rotulo">Local</span>
                  <span className="info__valor">{evento.local}</span>
                  <a href={evento.mapsUrl} target="_blank" rel="noreferrer">Como chegar</a>
                </span>
              </div>
            </div>

            <div className="hero__acoes">
              <Link href="/inscricao" className="btn">Garantir meu ingresso</Link>
              <a href={`https://wa.me/?text=${encodeURIComponent(convidar)}`} className="btn btn--contorno" target="_blank" rel="noreferrer">
                <IconeWhats size={20} /> Convidar pelo WhatsApp
              </a>
            </div>
          </div>

          <div className="fotos" aria-label="Fotos de encontros anteriores">
            <figure className="polaroid">
              <img src="/fotos/encontro-1.jpg" alt="Violeiros tocando hinos em roda no salão" width={742} height={728} />
            </figure>
            <figure className="polaroid">
              <img src="/fotos/encontro-2.jpg" alt="Salão cheio de irmãos com violões em um encontro anterior" width={816} height={660} loading="lazy" />
            </figure>
          </div>
        </div>
      </section>

      <section className="secao" id="encontro">
        <div className="wrap">
          <div className="secao__cab">
            <div>
              <span className="eyebrow">01 / O encontro</span>
              <h2>Uma tarde muito especial. <span className="acento">Com alegria e comunhão.</span></h2>
            </div>
            <p className="suave">{evento.sobre.join(' ')}</p>
          </div>

          <span className="eyebrow">Como funciona</span>
          <ol className="passos">
            <li className="passo"><span className="passo__n">01</span><strong>Inscreva quem vai</strong><span>Você pode incluir toda a família de uma vez.</span></li>
            <li className="passo"><span className="passo__n">02</span><strong>Pague pelo Pix</strong><span>O QR Code e o código aparecem logo depois da inscrição.</span></li>
            <li className="passo"><span className="passo__n">03</span><strong>Mande o comprovante</strong><span>Tem um botão pronto para enviar no WhatsApp da organização.</span></li>
            <li className="passo"><span className="passo__n">04</span><strong>Receba os ingressos</strong><span>Cada pessoa ganha um QR Code e um número para a entrada.</span></li>
          </ol>
          {evento.programacao.length > 0 && (
            <ol className="agenda" style={{ marginTop: '2rem' }}>
              {evento.programacao.map((p) => (
                <li key={p.hora + p.titulo}><span className="agenda__hora">{p.hora}</span><span>{p.titulo}</span></li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="secao" id="ingressos">
        <div className="wrap">
          <div className="secao__cab">
            <div>
              <span className="eyebrow">02 / Ingressos</span>
              <h2>Garanta já <span className="acento">o seu ingresso.</span></h2>
            </div>
            <p className="suave">Não deixe para a última hora: chame seus amigos e familiares e faça a inscrição de todos de uma vez.</p>
          </div>
          <div className="precos">
            {(tipos ?? []).map((t, i) => (
              <div className={`preco ${i === 0 ? 'preco--destaque' : ''}`} key={t.id}>
                <div>
                  <div className="preco__nome">{t.nome}</div>
                  {t.descricao && <p className="preco__desc">{t.descricao}</p>}
                </div>
                <div className="preco__valor">{Number(t.preco) === 0 ? 'Grátis' : brl(t.preco)}</div>
              </div>
            ))}
          </div>
          <div className="botoes" style={{ marginTop: '1.25rem' }}>
            <Link href="/inscricao" className="btn">Fazer minha inscrição</Link>
          </div>
        </div>
      </section>

      <section className="secao" id="convite">
        <div className="wrap">
          <div className="secao__cab">
            <div>
              <span className="eyebrow">03 / Convite</span>
              <h2>Compartilhe <span className="acento">com os irmãos.</span></h2>
            </div>
            <p className="suave">Toque no convite para abrir em tamanho grande e salvar no celular.</p>
          </div>
          <a href="/convite.jpg" target="_blank" rel="noreferrer" className="convite-img">
            <img src="/convite.jpg" alt={`Convite do ${evento.nome}: ${evento.dataCurta}, ${evento.horario}, ${evento.local}, ${evento.valorTexto}`} width={1024} height={1536} loading="lazy" />
          </a>
        </div>
      </section>

      <section className="secao" id="patrocinadores">
        <div className="wrap">
          <div className="secao__cab">
            <div>
              <span className="eyebrow">04 / Patrocinadores</span>
              <h2>Quem apoia <span className="acento">o Encontro.</span></h2>
            </div>
            <p className="suave">Empresas e irmãos de Pinda e região que ajudam a fazer o encontro acontecer. Prestigie quem apoia.</p>
          </div>
          {patros && patros.length > 0 && <CarrosselPatrocinadores patros={patros as Patrocinador[]} />}
          <div className="cartao patro-cta">
            <div>
              <h3 style={{ margin: '0 0 .25rem' }}>Quer patrocinar o encontro?</h3>
              <p className="suave">Fale com a organização pelo WhatsApp {evento.whatsappTexto}.</p>
            </div>
            <div className="botoes">
              <a className="btn btn--madeira" href={linkWhats(evento.whatsappOrganizacao, `Olá! Tenho interesse em patrocinar o ${evento.nome}.`)} target="_blank" rel="noreferrer">
                <IconeWhats size={20} /> Quero patrocinar
              </a>
              {patros && patros.length > 1 && <Link className="btn btn--contorno" href="/patrocinadores">Ver todos</Link>}
            </div>
          </div>
        </div>
      </section>

      <Rodape />

      <div className="barra-cta">
        <span>Ingresso<strong>{evento.valorTexto} <small className="barra-cta__por">por pessoa</small></strong></span>
        <Link href="/inscricao" className="btn btn--claro">Inscrever-se</Link>
      </div>
    </div>
  );
}
