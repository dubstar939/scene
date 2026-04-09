import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export const createClient = () => {
  const config = getSupabaseConfig();
  
  if (!config.isValid) {
    return null;
  }
  
  return createBrowserClient(
    config.url!,
    config.key!,
  );
};
