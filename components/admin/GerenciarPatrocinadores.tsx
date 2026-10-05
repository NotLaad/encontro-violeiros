'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CartaoPatrocinador, type Patrocinador } from '@/components/CartaoPatrocinador';
import { IconeSeta } from '@/components/Icones';

type Item = Patrocinador & { ordem: number; ativo: boolean };
type Form = {
  id?: string;
  nome: string; categoria: string; cidade: string; descricao: string; tags: string;
  endereco: string; instagram: string; whatsapp: string; site: string;
  cor_fundo: string; logo_url: string; ativo: boolean;
};

const CORES = ['#fbf6ec', '#f4e7d3', '#efe2c6', '#e4ecdc', '#e3e8ee', '#f3e0dc', '#2f5130', '#6b1016', '#1f1f1f'];
const vazio: Form = {
  nome: '', categoria: '', cidade: 'Pindamonhangaba – SP', descricao: '', tags: '', endereco: '',
  instagram: '', whatsapp: '', site: '', cor_fundo: '#fbf6ec', logo_url: '', ativo: true,
};
const PASTA = 'patrocinadores';

function caminhoDoLogo(url: string) {
  const marca = `/object/public/${PASTA}/`;
  const i = url.indexOf(marca);
  return i >= 0 ? decodeURIComponent(url.slice(i + marca.length)) : null;
}

export function GerenciarPatrocinadores({ lista }: { lista: Item[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const campo = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value } : f));

  function abrir(p?: Item) {
    setErro('');
    setArquivo(null);
    setPrevia('');
    setForm(
      p
        ? {
            id: p.id, nome: p.nome, categoria: p.categoria ?? '', cidade: p.cidade ?? '', descricao: p.descricao ?? '',
            tags: (p.tags ?? []).join(', '), endereco: p.endereco ?? '', instagram: p.instagram ?? '',
            whatsapp: p.whatsapp ?? '', site: p.site ?? '', cor_fundo: p.cor_fundo ?? '#fbf6ec',
            logo_url: p.logo_url ?? '', ativo: p.ativo,
          }
        : { ...vazio },
    );
    window.scrollTo({ top: 0 });
  }

  function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErro('Escolha uma imagem (PNG, JPG, SVG ou WebP).');
    if (f.size > 2 * 1024 * 1024) return setErro('A imagem passa de 2 MB. Diminua o tamanho e tente de novo.');
    setErro('');
    setArquivo(f);
    setPrevia(URL.createObjectURL(f));
  }

  const cartaoPrevia: Patrocinador = useMemo(() => ({
    id: 'previa',
    nome: form?.nome || 'Nome do patrocinador',
    categoria: form?.categoria || null,
    cidade: form?.cidade || null,
    descricao: form?.descricao || null,
    tags: (form?.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    endereco: form?.endereco || null,
    instagram: form?.instagram || null,
    whatsapp: form?.whatsapp || null,
    site: form?.site || null,
    cor_fundo: form?.cor_fundo,
    logo_url: previa || form?.logo_url || null,
  }), [form, previa]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErro('');
    setSalvando(true);
    const supabase = createClient();
    let logo_url = form.logo_url || null;

    if (arquivo) {
      const ext = (arquivo.name.split('.').pop() || 'png').toLowerCase();
      const nomeArq = `${Date.now()}-${form.nome.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase().slice(0, 40)}.${ext}`;
      const { error } = await supabase.storage.from(PASTA).upload(nomeArq, arquivo, { contentType: arquivo.type, upsert: false });
      if (error) { setSalvando(false); return setErro('Não foi possível enviar o logo: ' + error.message); }
      logo_url = supabase.storage.from(PASTA).getPublicUrl(nomeArq).data.publicUrl;
      const antigo = form.logo_url && caminhoDoLogo(form.logo_url);
      if (antigo) await supabase.storage.from(PASTA).remove([antigo]);
    }

    const dados = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      cidade: form.cidade.trim() || null,
      descricao: form.descricao.trim() || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      endereco: form.endereco.trim() || null,
      instagram: form.instagram.replace('@', '').trim() || null,
      whatsapp: form.whatsapp.replace(/\D/g, '') ? (form.whatsapp.replace(/\D/g, '').length <= 11 ? '55' : '') + form.whatsapp.replace(/\D/g, '') : null,
      site: form.site.trim() ? (/^https?:\/\//.test(form.site.trim()) ? form.site.trim() : 'https://' + form.site.trim()) : null,
      cor_fundo: form.cor_fundo,
      logo_url,
      ativo: form.ativo,
    };

    const { error } = form.id
      ? await supabase.from('patrocinadores').update(dados).eq('id', form.id)
      : await supabase.from('patrocinadores').insert({ ...dados, ordem: (lista.reduce((m, p) => Math.max(m, p.ordem), 0) || 0) + 1 });

    setSalvando(false);
    if (error) return setErro('Não foi possível salvar: ' + error.message);
    setForm(null);
    router.refresh();
  }

  async function excluir(p: Item) {
    if (!confirm(`Excluir o patrocinador "${p.nome}"? Ele some do site na hora.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('patrocinadores').delete().eq('id', p.id);
    if (error) return setErro(error.message);
    const caminho = p.logo_url && caminhoDoLogo(p.logo_url);
    if (caminho) await supabase.storage.from(PASTA).remove([caminho]);
    router.refresh();
  }

  async function alternar(p: Item) {
    await createClient().from('patrocinadores').update({ ativo: !p.ativo }).eq('id', p.id);
    router.refresh();
  }

  async function mover(i: number, dir: -1 | 1) {
    const a = lista[i], b = lista[i + dir];
    if (!a || !b) return;
    const supabase = createClient();
    const oa = a.ordem === b.ordem ? i + 1 : a.ordem;
    const ob = a.ordem === b.ordem ? i + 1 + dir : b.ordem;
    await Promise.all([
      supabase.from('patrocinadores').update({ ordem: ob }).eq('id', a.id),
      supabase.from('patrocinadores').update({ ordem: oa }).eq('id', b.id),
    ]);
    router.refresh();
  }

  if (form) {
    return (
      <>
        <button type="button" className="voltar" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--mata)' }} onClick={() => setForm(null)}>
          <IconeSeta dir="esq" size={18} /> Patrocinadores
        </button>
        <h1 className="adm-titulo">{form.id ? 'Editar patrocinador' : 'Novo patrocinador'}</h1>

        <div className="detalhe">
          <form className="bloco" onSubmit={salvar}>
            <div className="campo">
              <label htmlFor="logo">Logo</label>
              <input id="logo" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={escolherArquivo} style={{ padding: '.6rem' }} />
              <small>PNG com fundo transparente fica melhor. Até 2 MB.</small>
            </div>
            <div className="campo">
              <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Cor de fundo do logo</span>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {CORES.map((c) => (
                  <button key={c} type="button" aria-label={`Usar a cor ${c}`} onClick={() => setForm({ ...form, cor_fundo: c })}
                    style={{ width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer', border: form.cor_fundo === c ? '3px solid var(--tinta)' : '1px solid var(--linha-forte)' }} />
                ))}
                <input type="color" aria-label="Escolher outra cor" value={form.cor_fundo} onChange={campo('cor_fundo')} style={{ width: 44, height: 36, minHeight: 36, padding: 2, borderRadius: 8 }} />
              </div>
            </div>
            <div className="campo"><label htmlFor="nome">Nome *</label><input id="nome" required value={form.nome} onChange={campo('nome')} /></div>
            <div className="campo"><label htmlFor="categoria">Ramo</label><input id="categoria" placeholder="Ex.: Restaurante, Mercado, Loja" value={form.categoria} onChange={campo('categoria')} /></div>
            <div className="campo"><label htmlFor="cidade">Cidade</label><input id="cidade" value={form.cidade} onChange={campo('cidade')} /></div>
            <div className="campo"><label htmlFor="descricao">Descrição curta</label><textarea id="descricao" rows={3} maxLength={220} value={form.descricao} onChange={campo('descricao')} /></div>
            <div className="campo"><label htmlFor="tags">Destaques</label><input id="tags" placeholder="Separe por vírgula: Marmitex, Delivery" value={form.tags} onChange={campo('tags')} /></div>
            <div className="campo"><label htmlFor="endereco">Endereço</label><input id="endereco" placeholder="Rua, número – bairro" value={form.endereco} onChange={campo('endereco')} /></div>
            <div className="campo"><label htmlFor="instagram">Instagram</label><input id="instagram" placeholder="@perfil" value={form.instagram} onChange={campo('instagram')} /></div>
            <div className="campo"><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" type="tel" placeholder="(12) 99999-9999" value={form.whatsapp} onChange={campo('whatsapp')} /></div>
            <div className="campo"><label htmlFor="site">Site</label><input id="site" placeholder="www.exemplo.com.br" value={form.site} onChange={campo('site')} /></div>
            <label className="conferir">
              <input type="checkbox" checked={form.ativo} onChange={campo('ativo')} />
              <span><strong>Mostrar no site</strong><br />Desmarque para esconder sem apagar.</span>
            </label>
            {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
            <div style={{ display: 'grid', gap: '.5rem' }}>
              <button className="btn btn--cheio" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar patrocinador'}</button>
              <button type="button" className="btn btn--contorno btn--cheio" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </form>

          <div>
            <span className="eyebrow">Prévia no site</span>
            <div style={{ maxWidth: 360 }}><CartaoPatrocinador p={cartaoPrevia} /></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <span className="eyebrow" style={{ marginBottom: '.25rem' }}>Área da equipe</span>
          <h1 className="adm-titulo" style={{ margin: 0 }}>Patrocinadores</h1>
        </div>
        <button className="btn btn--peq" onClick={() => abrir()}>+ Novo patrocinador</button>
      </div>
      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}

      {lista.length === 0 ? (
        <div className="aviso aviso--info">Nenhum patrocinador ainda. Toque em <strong>+ Novo patrocinador</strong> para cadastrar o primeiro.</div>
      ) : (
        <div className="pedidos">
          {lista.map((p, i) => (
            <div key={p.id} className="pedido" style={{ opacity: p.ativo ? 1 : 0.6 }}>
              <div style={{ display: 'flex', gap: '.85rem', alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, flex: 'none', borderRadius: 12, background: p.cor_fundo ?? '#fbf6ec', border: '1px solid var(--linha)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  {p.logo_url ? <img src={p.logo_url} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.8rem', color: 'var(--madeira)' }}>{p.nome.slice(0, 1)}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pedido__resp">{p.nome}</div>
                  <div className="pedido__meta">{[p.categoria, p.cidade].filter(Boolean).join(' · ') || 'Sem ramo informado'}</div>
                  <span className={`selo ${p.ativo ? 'selo--pago' : 'selo--cancelado'}`} style={{ marginTop: '.3rem' }}>{p.ativo ? 'No site' : 'Escondido'}</span>
                </div>
              </div>
              <div className="pedido__acoes" style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginTop: '.5rem' }}>
                <button className="btn btn--peq" onClick={() => abrir(p)}>Editar</button>
                <button className="btn btn--peq btn--contorno" onClick={() => alternar(p)}>{p.ativo ? 'Esconder' : 'Mostrar'}</button>
                <button className="btn btn--peq btn--contorno" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir na ordem">Subir</button>
                <button className="btn btn--peq btn--contorno" disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label="Descer na ordem">Descer</button>
                <button className="btn btn--peq btn--perigo" onClick={() => excluir(p)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="suave" style={{ fontSize: '.88rem', marginTop: '1rem' }}>A ordem aqui é a mesma do carrossel no site. As mudanças aparecem na hora.</p>
    </>
  );
}
