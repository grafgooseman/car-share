import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

const getEnvValue = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY') => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }

  return value;
};

export const getSupabaseBrowserClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      getEnvValue('VITE_SUPABASE_URL'),
      getEnvValue('VITE_SUPABASE_PUBLISHABLE_KEY'),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return supabaseClient;
};
