import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Only publishable keys belong in browser builds. Private keys are never accepted.
const validUrl = (() => {
  try { return new URL(url).protocol === 'https:'; } catch { return false; }
})();
export const supabase = validUrl && key?.startsWith('sb_publishable_')
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;
