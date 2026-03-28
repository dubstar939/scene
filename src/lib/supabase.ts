import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const isPlaceholder = (val?: string) => !val || val === 'your_supabase_url' || val === 'your_supabase_anon_key';

export const supabase = (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
