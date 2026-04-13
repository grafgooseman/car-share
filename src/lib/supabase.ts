import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
const SUPABASE_URL = 'https://cicvdjddubembapxdbzg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VXEJ34lIFjhxTXzKn5nLbQ_-EIYmc10';

export const getSupabaseBrowserClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseClient;
};
