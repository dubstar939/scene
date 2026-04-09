import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { supabaseMiddleware } from "../src/utils/supabase/middleware";
import { getSupabaseConfig } from "../src/utils/supabase/config";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Setup
const config = getSupabaseConfig();

const supabase = config.isValid 
  ? createClient(config.url!, config.key!) 
  : null;

if (supabase) {
  console.log("Supabase client initialized for persistent storage.");
} else {
  console.log("Supabase keys missing. Falling back to local users.json storage.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const USERS_FILE = path.join(process.cwd(), "users.json");

  app.use(cookieParser());
  app.use(supabaseMiddleware);

  // Sample Supabase route
  app.get("/api/todos", async (req, res) => {
    const { createClient: createSupabaseClient } = await import("../src/utils/supabase/server");
    const supabase = createSupabaseClient(req, res);
    
    if (!supabase) {
      return res.status(503).json({ error: "Supabase is not configured" });
    }

    const { data: todos, error } = await supabase.from("todos").select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(todos);
  });

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  const registeredUsers = new Map(); // id -> user data
  const emailToId = new Map(); // email -> id

  // Load users from file (Initial load or fallback)
  const loadUsersFromFile = () => {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, "utf-8");
        const usersArray = JSON.parse(data);
        usersArray.forEach(([key, user]: [string, any]) => {
          registeredUsers.set(user.id, user);
          if (user.email) {
            emailToId.set(user.email, user.id);
          }
        });
        console.log(`Loaded ${registeredUsers.size} users from ${USERS_FILE}`);
      }
    } catch (err) {
      console.error("Error loading users from file:", err);
    }
  };

  loadUsersFromFile();

  const saveUser = async (user: any) => {
    registeredUsers.set(user.id, user);
    if (user.email) {
      emailToId.set(user.email, user.id);
    }
    
    // Save to Supabase if available and not a guest
    if (supabase && !user.id.startsWith('guest-')) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            avatar: user.avatar,
            car: user.car
          }, { onConflict: 'email' });
        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase save error:", err.message || err.details || err);
      }
    }

    // Always save to file as fallback/backup (Skip on Vercel as it's read-only)
    if (!process.env.VERCEL) {
      try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(registeredUsers.entries()), null, 2));
      } catch (err) {
        console.error("Error saving users to file:", err);
      }
    }
  };

  const getUserByEmail = async (email: string) => {
    // Check cache first
    if (emailToId.has(email)) {
      return registeredUsers.get(emailToId.get(email));
    }

    // If supabase available, check there
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (data) {
          registeredUsers.set(data.id, data); // Cache it
          emailToId.set(email, data.id);
          return data;
        }
      } catch (err: any) {
        console.error("Supabase fetch error:", err.message || err.details || err);
      }
    }
    return null;
  };

  // API routes
  const apiRouter = express.Router();
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware for API
  apiRouter.use((req, res, next) => {
    console.log(`API Request: ${req.method} ${req.url}`);
    next();
  });

  apiRouter.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      storage: supabase ? "supabase" : "local",
      time: new Date().toISOString() 
    });
  });

  apiRouter.post("/auth/email/signup", async (req, res) => {
    console.log("Signup attempt:", req.body.email);
    const { email, password, name, avatar } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        name,
        avatar: avatar || `https://i.pravatar.cc/150?u=${email}`,
        car: 'New Member'
      };
      
      await saveUser(newUser);
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Error creating user" });
    }
  });

  apiRouter.post("/auth/email/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Error during login" });
    }
  });

  apiRouter.post("/profile/update", async (req, res) => {
    const { id, name, avatar, car, email: reqEmail } = req.body;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      // Find user by ID
      let user = null;
      let email = reqEmail;

      // 1. Try Supabase if available and not a guest
      if (supabase && !id.startsWith('guest-')) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          if (data) user = data;
        } catch (err) {
          console.error("Supabase profile fetch error:", err);
        }
      }

      // 2. Try local cache if not found in Supabase
      if (!user) {
        user = registeredUsers.get(id);
      }

      // 3. If still not found, check if authenticated via Supabase Auth
      if (!user && supabase && !id.startsWith('guest-')) {
        try {
          const { createClient: createSupabaseClient } = await import("../src/utils/supabase/server");
          const supabaseServer = createSupabaseClient(req, res);
          if (supabaseServer) {
            const { data: { user: authUser } } = await supabaseServer.auth.getUser();
            if (authUser && authUser.id === id) {
              email = authUser.email;
            }
          }
        } catch (err) {
          console.error("Supabase auth check error:", err);
        }
      }

      if (!user && !email) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = {
        ...(user || {}),
        id: id,
        email: email || (user ? user.email : null),
        name: name || (user ? user.name : "New Member"),
        avatar: avatar || (user ? user.avatar : `https://i.pravatar.cc/150?u=${id}`),
        car: car !== undefined ? car : (user ? user.car : "New Member")
      };

      // Ensure we have an email for the record (unless it's a guest, but guests should be in registeredUsers)
      if (!updatedUser.email && !id.startsWith('guest-')) {
        // Try to find by ID in registeredUsers one last time if it's not a guest but has no email
        const cachedUser = registeredUsers.get(id);
        if (cachedUser && cachedUser.email) {
          updatedUser.email = cachedUser.email;
        } else {
          return res.status(400).json({ error: "User email is required for profile update" });
        }
      }

      await saveUser(updatedUser);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: "Error updating profile" });
    }
  });

  app.use("/api", apiRouter);

  // Global error handler for JSON parsing errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
    if (err.status === 413) {
      return res.status(413).json({ error: "Payload too large. Please use a smaller image." });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to load Vite server:", err);
    }
  } else {
    // In production (including Vercel), serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        // Only serve index.html for non-API routes
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(distPath, "index.html"));
        } else {
          res.status(404).json({ error: "API route not found" });
        }
      });
    }
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Health check available at http://0.0.0.0:${PORT}/api/health`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
