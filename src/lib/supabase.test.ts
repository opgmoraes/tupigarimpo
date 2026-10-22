import { afterEach, describe, expect, it, vi } from 'vitest';
describe('browser credential boundary', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
  it('fails closed without configuration', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', ''); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    expect((await import('./supabase')).supabase).toBeNull();
  });
  it('rejects server secret keys', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_test_only');
    expect((await import('./supabase')).supabase).toBeNull();
  });
  it('fails closed for malformed URLs', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not a url');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_only');
    expect((await import('./supabase')).supabase).toBeNull();
  });
  it('rejects legacy JWTs rather than risk accepting a service role key', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'eyJ.test.not-a-real-key');
    expect((await import('./supabase')).supabase).toBeNull();
  });
});
