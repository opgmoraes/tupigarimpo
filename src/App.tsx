import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Workspace } from './Workspace';
import { BrandLogo } from './Brand';

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
  if (!supabase) return <main className="login"><section><BrandLogo/><h1>Vamos conectar seu estúdio.</h1><p>Configure a URL e a chave pública do Supabase no ambiente de build. Consulte o README para concluir a configuração.</p></section></main>;
  if (!ready) return <main className="login" aria-busy="true">Carregando sessão…</main>;
  if (session) return <Workspace key={session.user.id} session={session} />;
  return <main className="login"><section className="intro"><BrandLogo/><div className="intro-copy"><h1>Tem coisa boa<br/>pra garimpar.</h1><p>O estúdio da equipe que transforma bons produtos em achados de verdade.</p></div><div className="login-art"><div className="login-sun"/><img className="login-tupi" src="/brand/tupi-garimpando.png" alt="Tupi garimpando com sua lupa" width="350" height="350"/><img className="login-seal" src="/brand/selo-tupi.png" alt="Garimpado pelo Tupi" width="120" height="120"/></div><span className="intro-footer">Olho no preço. Capricho no achado.</span></section><section className="login-panel"><form onSubmit={login} className="login-form"><img className="login-avatar" src="/brand/tupi-avatar.png" alt="" width="66" height="66"/><span className="form-welcome">Bem-vindo ao seu QG</span><h2>Entre no estúdio.</h2><p>Seus produtos, ofertas e ideias<br/>têm um lugar por aqui.</p><label>E-mail<input type="email" autoComplete="username" placeholder="voce@exemplo.com" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Senha<input type="password" autoComplete="current-password" placeholder="Sua senha" required value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p role="alert" className="error">{error}</p>}<button className="login-submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button><div className="login-help"><span aria-hidden="true">✦</span><small>Acesso da equipe Tupi Garimpo.<br/>Precisa de ajuda? Fale com o administrador.</small></div></form><span className="login-copyright">Tupi Garimpo Studio · Feito para bons achados</span></section></main>;
}
