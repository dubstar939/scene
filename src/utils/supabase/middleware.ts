import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export const supabaseMiddleware = async (req: any, res: any, next: any) => {
  const config = getSupabaseConfig();
  
  if (!config.isValid) {
    return next();
  }
  
  const supabase = createServerClient(
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

  // This will refresh the session if it's expired
  await supabase.auth.getUser();

  next();
};
