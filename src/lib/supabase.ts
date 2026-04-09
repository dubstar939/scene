import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../utils/supabase/config';

const config = getSupabaseConfig();

export const supabase = config.isValid 
  ? createClient(config.url!, config.key!) 
  : null;
