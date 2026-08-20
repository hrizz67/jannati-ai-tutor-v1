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

export const supabaseConfig = {
  url: supabaseUrl || '',
  hasPublishableKey: Boolean(supabasePublishableKey)
};
