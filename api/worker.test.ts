import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { affiliateUrl, messageFor, type Env } from './worker';
const env: Env = { TELEGRAM_BOT_TOKEN: 'test-secret', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'test-public', STUDIO_ORIGIN: 'https://garimpo-studio.pages.dev' };
const id = '11111111-1111-4111-8111-111111111111';
const req = (path: string, method = 'GET') => new Request('https://worker.example' + path, { method, headers: { Authorization: 'Bearer test.jwt.token', Origin: env.STUDIO_ORIGIN } });
afterEach(() => vi.unstubAllGlobals());
describe('server authentication and affiliate validation', () => {
  it('rejects unauthenticated users before any upstream request', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect((await worker.fetch(new Request('https://worker.example/api/telegram/status'), env)).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects inactive membership', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(false)));
    expect((await worker.fetch(req('/api/telegram/status'), env)).status).toBe(403);
  });
  it('rejects store lookalikes and insecure URLs', () => {
    for (const value of ['https://amazon.com.br.evil.test/x', 'http://amzn.to/a', 'https://user:secret@amzn.to/x', 'javascript:alert(1)']) expect(() => affiliateUrl(value)).toThrow();
    expect(affiliateUrl('https://s.shopee.com.br/abc')).toBe('https://s.shopee.com.br/abc');
  });
  it('requires actual price reductions and highlights discounts and complete coupons', () => {
    const text = messageFor({ title: 'Achado', price: 50, old_price: 100, coupon_code: 'TUPI10', affiliate_url: 'https://amzn.to/abc' });
    expect(text).toContain('50% OFF'); expect(text).toContain('De R$'); expect(text).toContain('Por R$');
    expect(text).toContain('CUPOM: TUPI10'); expect(text).toContain('Publicidade'); expect(text).not.toContain('Link de afiliado');
    expect(() => messageFor({ title: 'Achado', price: 50, old_price: 40 })).toThrow('preço anterior');
    expect(() => messageFor({ title: 'Achado', price: 0 })).toThrow();
  });
});
function setup(claim = true, ambiguous = false) {
  const calls: Array<{ url: string; body: any }> = [];
  vi.stubGlobal('fetch', vi.fn(async (input: string, options: RequestInit = {}) => {
    const url = String(input), body = options.body ? JSON.parse(String(options.body)) : undefined;
    calls.push({ url, body });
    if (url.includes('rpc/')) return Response.json(true);
    if (url.includes('/bot')) {
      if (ambiguous) throw new Error('Network lost with secret URL');
      return Response.json({ ok: true, result: { message_id: 42 } });
    }
    if (options.method === 'PATCH') return Response.json(claim ? [{ id }] : []);
    if (url.includes('/publications?')) return Response.json([{ id, status: 'draft', offer_id: id, channel_id: id }]);
    if (url.includes('/offers?')) return Response.json([{ id, product_id: id, status: 'approved' }]);
    if (url.includes('/channels?')) return Response.json([{ active: true, platform: 'telegram', external_id: '@tupigarimpo' }]);
    return Response.json([{ title: 'Produto real', price: 50, old_price: 100, affiliate_url: 'https://amzn.to/abc' }]);
  }));
  return calls;
}
describe('publication delivery', () => {
  it('does not send when another request claimed the draft', async () => {
    const calls = setup(false);
    expect((await worker.fetch(req(`/api/publications/${id}/send`, 'POST'), env)).status).toBe(409);
    expect(calls.some(c => c.url.includes('/bot'))).toBe(false);
  });
  it('records the message id after a successful send', async () => {
    const calls = setup();
    expect((await worker.fetch(req(`/api/publications/${id}/send`, 'POST'), env)).status).toBe(200);
    expect(calls.at(-1)?.body.external_message_id).toBe('42');
    expect(calls.filter(c => c.url.includes('/bot'))).toHaveLength(1);
  });
  it('keeps ambiguous delivery locked and never reveals private upstream errors', async () => {
    const calls = setup(true, true);
    const response = await worker.fetch(req(`/api/publications/${id}/send`, 'POST'), env);
    expect(response.status).toBe(502); expect(await response.text()).not.toContain('secret URL');
    expect(calls.at(-1)?.body).not.toHaveProperty('status');
    expect(calls.at(-1)?.body.error_message).toContain('sem confirmação');
  });
});
