import { discountFor } from '../shared/discount';
export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  STUDIO_ORIGIN: string;
}
type RecordData = Record<string, any>;
class PublicError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const target = '@tupigarimpo';
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const json = (value: unknown, status = 200) => Response.json(value, { status });
export function affiliateUrl(value: unknown): string {
  if (typeof value !== 'string') throw new PublicError(422, 'Cadastre o link de afiliado do produto.');
  let u: URL;
  try { u = new URL(value); } catch { throw new PublicError(422, 'Link de afiliado inválido.'); }
  const hosts = ['mercadolivre.com.br', 'mercadolivre.com', 'meli.la', 'amazon.com.br', 'amzn.to', 'shopee.com.br', 's.shopee.com.br', 'shope.ee', 'shein.com', 'onelink.shein.com'];
  if (u.protocol !== 'https:' || u.username || u.password || !hosts.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) throw new PublicError(422, 'Use um link HTTPS de uma das quatro lojas.');
  return u.href;
}
export function messageFor(product: RecordData): string {
  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0 || !product.title) throw new PublicError(422, 'Produto sem título ou preço válido.');
  let discount: ReturnType<typeof discountFor>;
  try { discount = discountFor(product); } catch (error) { throw new PublicError(422, (error as Error).message); }
  return ['⛏️ ACHADO DO TUPI', '', String(product.title).slice(0, 220), `🔥 ${discount.percent}% OFF • Economize ${discount.saving}`, `De ${discount.previous}`, `Por ${discount.current}`, discount.coupon ? `🎟️ CUPOM: ${discount.coupon}` : '', '', '🛒 Garanta o seu:', affiliateUrl(product.affiliate_url), '', 'Publicidade • Preço e disponibilidade podem mudar.'].filter((line, i, all) => line || all[i - 1]).join('\n');
}
async function telegram(env: Env, method: string, body: RecordData) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new PublicError(503, 'O segredo do Telegram ainda não foi configurado.');
  // Never log this URL or return upstream error descriptions: they can contain credentials.
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as RecordData;
  if (!response.ok || !data.ok) throw new PublicError(502, 'Telegram não confirmou a operação. Verifique o bot e as permissões do canal.');
  return data.result as RecordData;
}
async function handle(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (path === '/health' && request.method === 'GET') return json({ service: 'garimpo-studio-api', configured: Boolean(env.TELEGRAM_BOT_TOKEN && env.SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_URL) });
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new PublicError(503, 'A conexão do servidor com o Supabase ainda precisa ser configurada.');
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer [\w.-]+$/.test(auth)) throw new PublicError(401, 'Entre no Studio para continuar.');
  async function db(route: string, options: RequestInit = {}) {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${route}`, { ...options, headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: auth, 'Content-Type': 'application/json', Prefer: 'return=representation', ...options.headers }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new PublicError(response.status === 401 ? 401 : 502, 'Não foi possível consultar ou salvar no Supabase.');
    return response.status === 204 ? null : response.json();
  }
  if (await db('rpc/is_garimpo_member', { method: 'POST', body: '{}' }) !== true) throw new PublicError(403, 'Acesso permitido apenas para membros ativos.');
  if (path === '/api/telegram/status' && request.method === 'GET') {
    const bot = await telegram(env, 'getMe', {});
    const member = await telegram(env, 'getChatMember', { chat_id: target, user_id: bot.id });
    return json({ username: bot.username, channel: target, canPublish: member.status === 'creator' || (member.status === 'administrator' && member.can_post_messages !== false) });
  }
  const match = path.match(/^\/api\/publications\/([\da-f-]+)\/send$/i);
  if (!match || request.method !== 'POST') return json({ error: 'Rota não encontrada.' }, 404);
  const id = match[1];
  if (!uuid.test(id)) throw new PublicError(400, 'Publicação inválida.');
  const publications = await db(`publications?id=eq.${id}&select=*`) as RecordData[];
  const publication = publications[0];
  if (!publication) throw new PublicError(404, 'Publicação não encontrada.');
  if (publication.status !== 'draft' && publication.status !== 'scheduled') throw new PublicError(409, 'Esta publicação já foi processada ou precisa ser revisada.');
  const offers = await db(`offers?id=eq.${encodeURIComponent(publication.offer_id)}&select=*`) as RecordData[];
  const offer = offers[0];
  if (!offer || !['approved', 'ready'].includes(offer.status)) throw new PublicError(422, 'Aprove a oferta antes de publicar.');
  const channels = await db(`channels?id=eq.${encodeURIComponent(publication.channel_id)}&select=*`) as RecordData[];
  const channel = channels[0];
  if (!channel?.active || channel.platform !== 'telegram' || ![target, 'https://t.me/tupigarimpo'].includes(channel.external_id)) throw new PublicError(422, 'Selecione o canal ativo @tupigarimpo.');
  const products = await db(`products?id=eq.${encodeURIComponent(offer.product_id)}&select=*`) as RecordData[];
  const message = messageFor(products[0] || {});
  // Compare-and-set prevents two clicks/runs from sending the same draft.
  const claimed = await db(`publications?id=eq.${id}&status=eq.${publication.status}`, { method: 'PATCH', body: JSON.stringify({ status: 'publishing', message, error_message: null }) }) as RecordData[];
  if (claimed.length !== 1) throw new PublicError(409, 'Outra execução já assumiu este envio.');
  let result: RecordData;
  try { result = await telegram(env, 'sendMessage', { chat_id: target, text: message, link_preview_options: { is_disabled: false } }); }
  catch {
    // A network error can happen AFTER Telegram accepted the message. Do not retry automatically.
    try { await db(`publications?id=eq.${id}&status=eq.publishing`, { method: 'PATCH', body: JSON.stringify({ error_message: 'Envio sem confirmação. Confira o canal antes de qualquer reenvio.' }) }); } catch { /* The publishing state still prevents retries. */ }
    throw new PublicError(502, 'Envio sem confirmação. Confira o canal; o sistema bloqueou o reenvio automático.');
  }
  try { await db(`publications?id=eq.${id}&status=eq.publishing`, { method: 'PATCH', body: JSON.stringify({ status: 'published', published_at: new Date().toISOString(), external_message_id: String(result.message_id), error_message: null }) }); }
  catch { throw new PublicError(502, 'Telegram confirmou o envio, mas o registro não foi atualizado. Confira o canal; não reenvie.'); }
  return json({ published: true, messageId: String(result.message_id) });
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = { 'Access-Control-Allow-Origin': env.STUDIO_ORIGIN || 'https://garimpo-studio.pages.dev', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (origin && origin !== headers['Access-Control-Allow-Origin']) return json({ error: 'Origem não permitida.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    let response: Response;
    try { response = await handle(request, env); }
    catch (error) { response = json({ error: error instanceof PublicError ? error.message : 'Operação indisponível. Tente novamente mais tarde.' }, error instanceof PublicError ? error.status : 500); }
    for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    return response;
  },
};
