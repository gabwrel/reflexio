import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

let supabaseClient: SupabaseClient | null = null;

/**
 * Initializes and returns a Supabase client if the credentials are provided
 * in environment variables. Returns null otherwise.
 */
export function getSupabaseClient(): SupabaseClient | null {
  let url = process.env.SUPABASE_URL?.trim() ?? process.env.VITE_SUPABASE_URL?.trim();
  if (!url || url === '' || url.includes('MY_APP_URL') || url.includes('placeholder')) {
    url = supabaseUrl;
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? supabaseKey;

  if (!url || !serviceKey || serviceKey === '' || serviceKey.includes('placeholder')) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
        },
      });
      console.log('Successfully initialized Supabase Client.');
    } catch (error) {
      supabaseClient = null;
    }
  }

  return supabaseClient;
}
