/**
 * Shared Supabase configuration
 * Centralized configuration and validation for Supabase credentials
 */

export interface SupabaseConfig {
  url?: string;
  key?: string;
  isValid: boolean;
}

const getSupabaseConfig = (): SupabaseConfig => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;
  
  const isPlaceholder = (val?: string): boolean => {
    return !val || 
           val === 'your_supabase_url' || 
           val === 'your_supabase_anon_key' || 
           val === 'sb_publishable_y8mDLKQOz3ZLy_Jpb6-1Vg_lonFXmzb';
  };
  
  const isValid = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseKey);
  
  return {
    url: supabaseUrl,
    key: supabaseKey,
    isValid,
  };
};

export { getSupabaseConfig };
