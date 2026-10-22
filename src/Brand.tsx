import type { Table } from './lib/records';
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'brand-lockup compact' : 'brand-lockup'}><img src="/brand/logo-tupi.png" alt="Tupi Garimpo" width="230" height="136" /><span>Studio</span></div>;
}
export const sectionDescriptions: Record<Table, string> = {
  profiles: 'Seu lugar na equipe de garimpeiros.',
  products: 'Os produtos que merecem entrar no radar.',
  offers: 'Compare, revise e prepare os melhores achados.',
  channels: 'Cada achado tem seu grupo certo.',
  templates: 'A voz e o visual do Tupi em cada mensagem.',
  publications: 'Deixe as mensagens prontas para o próximo passo.',
};
export function StudioHero() {
  return <section className="studio-hero"><div className="hero-copy"><span className="hero-tag">Seu QG de bons achados</span><h2>Bora garimpar<br/>coisa boa?</h2><p>Um lugar para organizar os produtos, caprichar nas ofertas e deixar tudo com a cara do Tupi.</p><span className="hero-note"><span aria-hidden="true">✦</span> Olho no preço. Capricho no achado.</span></div><div className="hero-art"><div className="hero-orbit"/><img className="hero-mascot" src="/brand/tupi-garimpando.png" alt="Tupi procurando um achado com sua lupa" width="300" height="300"/><img className="hero-seal" src="/brand/selo-tupi.png" alt="Selo da marca: Garimpado pelo Tupi" width="100" height="100"/></div></section>;
}
export function NavIcon({ section }: { section: Table }) {
  const paths: Record<Table, string> = {
    profiles: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 8h5m-5 4h4',
    products: 'm12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10M7.5 5.5l9 5',
    offers: 'M20 13 11 22 2 13V3h10l8 8v2ZM7 8h.01M11 9l5 5',
    channels: 'm22 2-7 20-4-9-9-4 20-7ZM11 13 22 2',
    templates: 'm12 3 10 5-10 5L2 8l10-5Zm-10 10 10 5 10-5M2 18l10 5 10-5',
    publications: 'M4 5h16v17H4V5ZM8 2v6m8-6v6M4 11h16m-12 4h3m2 0h3m-8 4h3',
  };
  return <svg viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[section]}/></svg>;
}
export function EmptyState({ table, failed, onCreate }: { table: Table; failed: boolean; onCreate: () => void }) {
  return <section className="empty"><img src={failed ? '/brand/tupi-positivo.png' : '/brand/tupi-celular.png'} alt="" width="170" height="185"/><div><span className="empty-tag">{failed ? 'Vamos tentar de novo' : 'Espaço para bons achados'}</span><h2>{failed ? 'Não conseguimos abrir os registros' : table === 'profiles' ? 'Seu perfil está sendo preparado' : 'O próximo achado pode ser seu.'}</h2><p>{failed ? 'Confira a conexão e clique em Atualizar.' : table === 'profiles' ? 'Peça ao administrador para completar seu cadastro.' : `Comece pelos ${table === 'offers' ? 'produtos e crie sua primeira oferta' : table === 'publications' ? 'produtos, ofertas e canais para montar um rascunho' : 'primeiros registros da sua equipe'}. O Tupi já está de olho!`}</p>{!failed && table !== 'profiles' && <button className="secondary" onClick={onCreate}>Adicionar {table === 'products' ? 'produto' : table === 'offers' ? 'oferta' : table === 'channels' ? 'canal' : table === 'templates' ? 'modelo' : 'rascunho'}</button>}</div></section>;
}
