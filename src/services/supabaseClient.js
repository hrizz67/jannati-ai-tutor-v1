const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL;
const supabasePublishableKey = runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
let clientPromise = null;

// The publishable key is safe to use in a browser. Real access control still
// comes from Supabase Auth and Row Level Security, never from this client.
export function getSupabaseClient() {
  if (!supabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }))
      .catch(error => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

// Guardian authorization must prove a fresh password session without replacing
// the learner's persisted browser session or broadcasting an auth-state change.
// This short-lived client keeps its session in memory only and is discarded
// after the consent RPC completes.
export async function getSupabaseReauthenticationClient() {
  if (!supabaseConfigured) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export const supabaseConfig = {
  url: supabaseUrl || '',
  hasPublishableKey: Boolean(supabasePublishableKey)
};
