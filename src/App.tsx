import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Workspace } from './Workspace';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setPassword('');
    } catch { setError('Não foi possível entrar. Confira e-mail e senha ou tente novamente.'); }
    finally { setBusy(false); }
  }
  if (!supabase) return <main className="login"><section><span className="brand">Garimpo Studio</span><h1>Vamos conectar seu estúdio.</h1><p>Configure a URL e a chave pública do Supabase no ambiente de build. Consulte o README para concluir a configuração.</p></section></main>;
  if (!ready) return <main className="login" aria-busy="true">Carregando sessão…</main>;
  if (session) return <Workspace key={session.user.id} session={session} />;
  return <main className="login"><section className="intro"><span className="brand">✦ Garimpo Studio</span><h1>Seu próximo<br/>grande achado<br/>começa aqui.</h1><p>Organize produtos, prepare ofertas e acompanhe suas publicações em um só lugar.</p></section><form onSubmit={login} className="login-form"><h2>Entre no estúdio</h2><p>Acesso exclusivo para membros da equipe.</p><label>E-mail<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p role="alert" className="error">{error}</p>}<button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button><small>Precisa de acesso ou de uma nova senha? Fale com o administrador do estúdio.</small></form></main>;
}
