import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
const api = '';
export async function sendPublication(session: Session, id: string) {
  return call(session, `/api/publications/${encodeURIComponent(id)}/send`, 'POST');
}
async function call(session: Session, path: string, method = 'GET') {
  const response = await fetch(api + path, { method, headers: { Authorization: `Bearer ${session.access_token}` }, signal: AbortSignal.timeout(45000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível conectar ao servidor.');
  return data;
}
export function TelegramPanel({ session }: { session: Session }) {
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true); setStatus('');
    try { const data = await call(session, '/api/telegram/status'); setStatus(data.canPublish ? `@${data.username} pronto para publicar no ${data.channel}.` : 'Bot conectado. Adicione-o ao canal como administrador com permissão para publicar.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Conexão indisponível.'); }
    finally { setBusy(false); }
  }
  return <section className="telegram-panel" aria-label="Conexão Telegram"><div><strong>Telegram · @tupigarimpo</strong><p>Mensagem pronta a partir da oferta aprovada. Seus tokens ficam no servidor.</p>{status && <p role="status">{status}</p>}</div><button className="secondary" disabled={busy} onClick={check}>{busy ? 'Verificando…' : 'Verificar conexão'}</button></section>;
}
