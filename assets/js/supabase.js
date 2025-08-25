// Optional cloud sync via Supabase. Safe no-op if not configured.
const SUPABASE_URL = window.SUPABASE_URL || '';        // <-- paste later
const SUPABASE_ANON = window.SUPABASE_ANON_KEY || '';  // <-- paste later

let client = null;

export function supabaseReady(){
  return !!(SUPABASE_URL && SUPABASE_ANON);
}

export async function syncBootstrap(){
  if (!supabaseReady()) return;
  // Lazy import to avoid 404 when offline
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  client = createClient(SUPABASE_URL, SUPABASE_ANON);

  // Example: pull entitlements for signed-in user (when auth arrives)
  // const { data } = await client.from('entitlements').select('*').single();
  // window.__entitlements = data || {};
}
