import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { labels, parseRecord, tables, titleOf, type Row, type Table } from './lib/records';
import { initialRecord, RecordFields } from './RecordFields';
import { BrandLogo, EmptyState, NavIcon, sectionDescriptions, StudioHero } from './Brand';

export function Workspace({ session }: { session: Session }) {
  const [member, setMember] = useState<boolean | null>(null);
  const [table, setTable] = useState<Table>('offers');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<{ id?: string | number; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  useEffect(() => {
    let active = true;
    supabase!.rpc('is_garimpo_member').then(({ data, error }) => {
      if (active) { setMember(!error && data === true); if (error) setError('Não foi possível verificar seu acesso. Verifique a migração e a conexão.'); }
    });
    return () => { active = false; };
  }, [session.access_token, revision]);
  useEffect(() => {
    let active = true;
    setRows([]); setEditor(null); setError('');
    if (!member) return;
    setBusy(true);
    let query = supabase!.from(table).select('*').order(table === 'profiles' ? 'user_id' : 'id').limit(100);
    if (table === 'profiles') query = query.eq('user_id', session.user.id);
    query.then(({ data, error }) => {
      if (active) { setRows((data ?? []) as Row[]); setError(error ? 'Não foi possível carregar os registros. Confira conexão, colunas e permissões no Supabase.' : ''); setBusy(false); }
    });
    return () => { active = false; };
  }, [table, member, revision, session.user.id, session.access_token]);
  async function logout() {
    const { error } = await supabase!.auth.signOut();
    if (error) setError('Não foi possível encerrar a sessão. Tente novamente.');
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!editor || saving) return;
    setSaving(true); setEditError('');
    try {
      const payload = parseRecord(editor.text);
      if (editor.id !== undefined) delete payload.id;
      const query = editor.id === undefined ? supabase!.from(table).insert(payload) : supabase!.from(table).update(payload).eq('id', editor.id);
      const { data, error } = await query.select('id');
      if (error) throw new Error('Não foi possível salvar. Confira os campos obrigatórios e as permissões da tabela.');
      if (!data?.length) throw new Error('Nenhum registro foi alterado. Seu acesso pode ter sido revogado.');
      setEditor(null); setRevision(n => n + 1);
    } catch (e) { setEditError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }
  const openNew = () => { setEditError(''); setEditor({ text: JSON.stringify(initialRecord(table)) }); };
  if (member === null) return <main className="loading-screen" aria-busy="true"><BrandLogo/><p>O Tupi está abrindo seu estúdio…</p></main>;
  if (!member) return <main className="loading-screen"><BrandLogo/><section><h1>Acesso pendente</h1><p>{error || 'Sua conta ainda não foi autorizada como membro. Peça ao administrador para liberar seu acesso.'}</p><div className="actions"><button onClick={() => setRevision(n => n + 1)}>Verificar novamente</button><button className="secondary" onClick={logout}>Sair</button></div></section></main>;
  return <div className="workspace">
    <aside className="studio-sidebar">
      <BrandLogo compact/>
      <span className="nav-caption">Seu estúdio</span>
      <nav aria-label="Seções do estúdio">{tables.map(t => <button key={t} aria-current={table === t ? 'page' : undefined} onClick={() => setTable(t)}><NavIcon section={t}/><span>{labels[t]}</span>{table === t && <span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-tupi"><img src="/brand/tupi-positivo.png" alt="" width="85" height="100"/><p>Achado bom<br/><strong>a gente compartilha.</strong></p></div>
      <div className="sidebar-account"><span className="account-initial">{session.user.email?.slice(0,1).toUpperCase() || 'T'}</span><div><strong>Equipe Tupi</strong><small>{session.user.email}</small></div><button className="signout-button" aria-label="Sair da conta" title="Sair da conta" onClick={logout}>↪</button></div>
    </aside>
    <div className="studio-content">
      <div className="topbar"><div><span className="breadcrumb-brand">Garimpo Studio</span><span aria-hidden="true"> / </span><span>{labels[table]}</span></div><span className="member-chip"><span/>Membro da equipe</span></div>
      <main>
        <StudioHero/>
        <header className="section-header"><div><h1>{labels[table]}</h1><p>{sectionDescriptions[table]}</p></div>{table !== 'profiles' && <button className="create-button" onClick={openNew}><span aria-hidden="true">＋</span> Novo registro</button>}</header>
        <section className="data-panel" aria-label={labels[table]}>
          <div className="toolbar"><p><span className="count-badge">{rows.length}</span> registros carregados <small>(até 100 por consulta)</small></p><button className="refresh-button" onClick={() => setRevision(n => n + 1)}><span aria-hidden="true">↻</span> Atualizar</button></div>
          {error && <p role="alert" className="error">{error}</p>}
          {busy ? <p role="status" className="table-loading">Carregando registros…</p> : rows.length === 0 ? <EmptyState table={table} failed={Boolean(error)} onCreate={openNew}/> : <div className="records">{rows.map((row, i) => <article key={String(row.id ?? row.user_id ?? i)}>
            {typeof row.image_url === 'string' && row.image_url.startsWith('https://') && <img className="product-image" src={row.image_url} alt="" loading="lazy" onError={e => { e.currentTarget.hidden = true; }}/>}<h2>{titleOf(row)}</h2><dl>{Object.entries(row).filter(([k]) => !/token|secret|password|api.?key|authorization/i.test(k) && k !== 'image_url' && k !== 'id' && k !== 'user_id').map(([key, value]) => <div key={key}><dt>{displayLabel(key)}</dt><dd>{displayValue(key,value)}</dd></div>)}</dl>{table !== 'profiles' && (typeof row.id === 'string' || typeof row.id === 'number') && <button className="secondary" onClick={() => { setEditError(''); setEditor({ id: row.id as string | number, text: JSON.stringify(row, null, 2) }); }}>Editar registro</button>}</article>)}</div>}
        </section>
        <footer className="studio-footer"><img src="/brand/logo-lettering.png" alt="Tupi Garimpo" width="94" height="54"/><p>Do garimpo à sua comunidade.<br/><strong>O cuidado começa aqui.</strong></p><span>Studio da equipe</span></footer>
      </main>
    </div>
    {editor && <section className="editor" role="dialog" aria-modal="true" aria-label="Editor de registro"><form onSubmit={save}><div className="editor-header"><div><span className="form-welcome">{labels[table]}</span><h2>{editor.id === undefined ? 'Um novo achado por aqui.' : 'Vamos caprichar nos detalhes.'}</h2></div><img src="/brand/tupi-avatar.png" alt="" width="62" height="62"/></div><RecordFields table={table} record={parseRecord(editor.text)} onChange={row => setEditor({ ...editor, text: JSON.stringify(row) })}/>{editError && <p role="alert" className="error">{editError}</p>}<div className="actions"><button disabled={saving}>{saving ? 'Salvando…' : 'Salvar registro'}</button><button type="button" className="secondary" disabled={saving} onClick={() => setEditor(null)}>Cancelar</button></div></form></section>}
  </div>;
}

function displayLabel(key: string): string {
  const names: Record<string,string> = { name:'Nome', title:'Produto', role:'Papel na equipe', active:'Ativo', created_at:'Adicionado em', updated_at:'Atualizado em', platform:'Plataforma', price:'Preço atual',old_price:'Preço anterior',coupon_code:'Cupom',category:'Categoria',description:'Descrição',original_url:'Link original',affiliate_url:'Link de afiliado',image_urls:'Imagens adicionais',created_by:'Criado por',status:'Etapa',score:'Nota do achado',notes:'Observações',approved_by:'Aprovado por',approved_at:'Aprovado em',external_id:'Identificador do canal',product_id:'Produto relacionado',offer_id:'Oferta relacionada',channel_id:'Canal relacionado',message:'Mensagem',scheduled_at:'Agendamento',published_at:'Publicado em',external_message_id:'Mensagem no canal',error_message:'Falha no envio',type:'Formato',content:'Conteúdo' };
  return names[key] ?? key;
}
function displayValue(key: string,value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if ((key === 'price' || key === 'old_price') && typeof value === 'number') return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
  if (key.endsWith('_at') && typeof value === 'string') { const date=new Date(value); if (!Number.isNaN(date.valueOf())) return date.toLocaleDateString('pt-BR'); }
  const words: Record<string,string> = { admin:'Administrador',operator:'Operador',new:'Nova',review:'Em revisão',approved:'Aprovada',rejected:'Rejeitada',ready:'Pronta',published:'Publicada',draft:'Rascunho',scheduled:'Agendada',publishing:'Enviando',failed:'Falha',message:'Mensagem',story:'Story',feed:'Feed',card:'Card' };
  if ((key==='status'||key==='role'||key==='type') && typeof value==='string') return words[value] ?? value;
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
