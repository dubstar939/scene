import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;

const isPlaceholder = (val?: string) => !val || val === 'your_supabase_url' || val === 'your_supabase_anon_key' || val === 'sb_publishable_y8mDLKQOz3ZLy_Jpb6-1Vg_lonFXmzb';

export const createClient = () => {
  if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseKey)) {
    return null;
  }
  
  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
};
