import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { titleOf, type Row, type Table } from './lib/records';

type Field = { key: string; label: string; type?: 'number' | 'url' | 'textarea' | 'boolean' | 'json'; required?: boolean; options?: string[]; relation?: Table; min?: number; max?: number };
const fields: Record<Exclude<Table, 'profiles'>, Field[]> = {
  products: [
    { key: 'title', label: 'Nome do produto', required: true },
    { key: 'platform', label: 'Loja ou plataforma', required: true },
    { key: 'original_url', label: 'Link original', type: 'url' },
    { key: 'affiliate_url', label: 'Seu link de afiliado', type: 'url' },
    { key: 'image_url', label: 'Link da imagem', type: 'url' },
    { key: 'price', label: 'Preço atual (R$)', type: 'number', min: 0 },
    { key: 'old_price', label: 'Preço anterior (R$)', type: 'number', min: 0 },
    { key: 'coupon_code', label: 'Cupom' }, { key: 'category', label: 'Categoria' },
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ],
  offers: [
    { key: 'product_id', label: 'Produto', required: true, relation: 'products' },
    { key: 'status', label: 'Etapa', required: true, options: ['new','review','approved','rejected','ready','published'] },
    { key: 'score', label: 'Nota do achado (0 a 100)', type: 'number', min: 0, max: 100 },
    { key: 'notes', label: 'Observações', type: 'textarea' },
  ],
  channels: [
    { key: 'name', label: 'Nome do canal', required: true },
    { key: 'platform', label: 'Plataforma', required: true },
    { key: 'external_id', label: 'Identificador do canal ou grupo' },
    { key: 'category', label: 'Categoria' }, { key: 'active', label: 'Canal ativo', type: 'boolean' },
  ],
  templates: [
    { key: 'name', label: 'Nome do modelo', required: true },
    { key: 'type', label: 'Formato', required: true, options: ['message','story','feed','card'] },
    { key: 'content', label: 'Conteúdo do modelo (JSON)', required: true, type: 'json' },
    { key: 'active', label: 'Modelo ativo', type: 'boolean' },
  ],
  publications: [
    { key: 'offer_id', label: 'Oferta', required: true, relation: 'offers' },
    { key: 'channel_id', label: 'Canal', required: true, relation: 'channels' },
    { key: 'message', label: 'Mensagem', type: 'textarea' },
    { key: 'image_url', label: 'Link da imagem', type: 'url' },
  ],
};
const optionLabels: Record<string, string> = { new:'Nova',review:'Em revisão',approved:'Aprovada',rejected:'Rejeitada',ready:'Pronta',published:'Publicada',message:'Mensagem',story:'Story',feed:'Feed',card:'Card' };
export function initialRecord(table: Table, row: Row = {}): Row {
  const defaults: Partial<Record<Table, Row>> = { products:{}, offers:{status:'new'}, channels:{platform:'telegram',active:true}, templates:{type:'message',content:{},active:true}, publications:{status:'draft'} };
  return { ...defaults[table], ...row };
}
function Relation({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  const [options, setOptions] = useState<Row[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const columns = field.relation === 'offers' ? 'id, products(title)' : field.relation === 'products' ? 'id,title' : 'id,name';
    supabase!.from(field.relation!).select(columns).limit(100).then(({ data, error }) => {
      if (!active) return;
      // Products/channels have different display columns; request exact columns.
      setFailed(Boolean(error)); setOptions((data ?? []) as Row[]);
    });
    return () => { active = false; };
  }, [field.relation]);
  return <><select aria-label={field.label} required={field.required} value={value} onChange={e => onChange(e.target.value)}><option value="">Selecione…</option>{options.map(row => <option key={String(row.id)} value={String(row.id)}>{row.products && typeof row.products === 'object' ? titleOf(row.products as Row) : titleOf(row)}</option>)}{value && !options.some(row => row.id === value) && <option value={value}>Registro atual</option>}</select>{failed && <small role="alert">Não foi possível carregar as opções. Confira a conexão e reabra o formulário.</small>}</>;
}
export function RecordFields({ table, record, onChange }: { table: Table; record: Row; onChange: (row: Row) => void }) {
  if (table === 'profiles') return null;
  const update = (key: string, value: unknown) => onChange({ ...record, [key]: value });
  return <>{table === 'publications' && <p>Este formulário salva um rascunho. Depois de salvar, use “Publicar no Telegram” para enviar a oferta aprovada.</p>}{fields[table].map(field => <label key={field.key}>{field.label}{field.relation ? <Relation field={field} value={String(record[field.key] ?? '')} onChange={v => update(field.key,v)} /> : field.options ? <select aria-label={field.label} required={field.required} value={String(record[field.key] ?? field.options[0])} onChange={e => update(field.key,e.target.value)}>{field.options.map(option => <option key={option} value={option}>{optionLabels[option] ?? option}</option>)}</select> : field.type === 'boolean' ? <input type="checkbox" checked={record[field.key] === true} onChange={e => update(field.key,e.target.checked)} /> : field.type === 'json' ? <JsonField value={record[field.key]} onChange={v => update(field.key,v)} /> : field.type === 'textarea' ? <textarea rows={4} value={String(record[field.key] ?? '')} onChange={e => update(field.key,e.target.value || null)} /> : <input required={field.required} type={field.type ?? 'text'} min={field.min} max={field.max} step={field.key === 'score' ? '1' : '0.01'} value={String(record[field.key] ?? '')} onChange={e => update(field.key,e.target.value === '' ? null : field.type === 'number' ? Number(e.target.value) : e.target.value)} />}</label>)}</>;
}
function JsonField({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const [text, setText] = useState(JSON.stringify(value ?? {}, null, 2));
  return <textarea rows={6} value={text} onChange={e => {
    setText(e.target.value);
    try { const next: unknown = JSON.parse(e.target.value); if (!next || Array.isArray(next) || typeof next !== 'object') throw new Error(); e.target.setCustomValidity(''); onChange(next); }
    catch { e.target.setCustomValidity('Informe um objeto JSON válido.'); }
  }} />;
}
