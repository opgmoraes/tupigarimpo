import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { labels, parseRecord, tables, titleOf, type Row, type Table } from './lib/records';
import { initialRecord, RecordFields } from './RecordFields';

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
  if (member === null) return <main className="login" aria-busy="true">Verificando acesso…</main>;
  if (!member) return <main className="login"><section><h1>Acesso pendente</h1><p>{error || 'Sua conta ainda não foi autorizada como membro. Peça ao administrador para liberar seu acesso.'}</p><button onClick={() => setRevision(n => n + 1)}>Verificar novamente</button> <button onClick={logout}>Sair</button></section></main>;
  return <div className="workspace"><aside><span className="brand">✦ Garimpo<br/>Studio</span><nav aria-label="Seções do estúdio">{tables.map(t => <button key={t} aria-current={table === t ? 'page' : undefined} onClick={() => setTable(t)}>{labels[t]}</button>)}</nav><small>{session.user.email}</small><button onClick={logout}>Sair da conta</button></aside><main><header><div><p>Seu estúdio de achados</p><h1>{labels[table]}</h1></div>{table !== 'profiles' && <button onClick={() => { setEditError(''); setEditor({ text: JSON.stringify(initialRecord(table)) }); }}>Novo registro</button>}</header><div className="toolbar"><p>{rows.length} registros carregados <small>(até 100 por consulta)</small></p><button className="secondary" onClick={() => setRevision(n => n + 1)}>Atualizar</button></div>{error && <p role="alert" className="error">{error}</p>}{busy ? <p role="status">Carregando registros…</p> : rows.length === 0 ? <section className="empty"><span>✦</span><h2>{error ? 'Os registros não foram carregados' : 'Tudo pronto para começar'}</h2><p>{error ? 'Tente atualizar após conferir a configuração.' : table === 'profiles' ? 'O administrador pode completar seu perfil no Supabase.' : 'Adicione seu primeiro registro para organizar os próximos achados.'}</p></section> : <div className="records">{rows.map((row, i) => <article key={String(row.id ?? i)}><h2>{titleOf(row)}</h2><dl>{Object.entries(row).filter(([k]) => !/token|secret|password|api.?key|authorization/i.test(k)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd></div>)}</dl>{table !== 'profiles' && (typeof row.id === 'string' || typeof row.id === 'number') && <button className="secondary" onClick={() => { setEditError(''); setEditor({ id: row.id as string | number, text: JSON.stringify(row, null, 2) }); }}>Editar registro</button>}</article>)}</div>}{editor && <section className="editor" aria-label="Editor de registro"><form onSubmit={save}><h2>{editor.id === undefined ? 'Novo registro' : 'Editar registro'}</h2><RecordFields table={table} record={parseRecord(editor.text)} onChange={row => setEditor({ ...editor, text: JSON.stringify(row) })} />{editError && <p role="alert" className="error">{editError}</p>}<div className="actions"><button disabled={saving}>{saving ? 'Salvando…' : 'Salvar registro'}</button><button type="button" className="secondary" disabled={saving} onClick={() => setEditor(null)}>Cancelar</button></div></form></section>}</main></div>;
}

