import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// The publishable key is safe to use in a browser. Real access control still
// comes from Supabase Auth and Row Level Security, never from this client.
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const supabaseConfig = {
  url: supabaseUrl || '',
  hasPublishableKey: Boolean(supabasePublishableKey)
};
