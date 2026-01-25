import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'set' : 'missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'missing',
    allEnv: import.meta.env
  });
  throw new Error('Missing Supabase environment variables. Make sure .env file exists in frontend/ directory and restart the dev server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
