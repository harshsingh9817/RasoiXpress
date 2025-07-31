import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.startsWith('REPLACE_WITH_')) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase credentials are not set in the .env file. Order management features will be disabled.');
}

export { supabase };
