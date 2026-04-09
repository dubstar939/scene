import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export const createClient = (req: any, res: any) => {
  const config = getSupabaseConfig();
  
  if (!config.isValid) {
    return null;
  }
  
  return createServerClient(
    config.url!,
    config.key!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map(name => ({ name, value: req.cookies[name] }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookie(name, value, options);
          });
        },
      },
    },
  );
};
