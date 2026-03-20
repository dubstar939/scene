import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";

import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Setup
/*
SQL to create the users table:
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password text not null,
  name text not null,
  avatar text,
  car text
);
*/
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Supabase client initialized for persistent storage.");
} else {
  console.log("Supabase keys missing. Falling back to local users.json storage.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const USERS_FILE = path.join(__dirname, "users.json");

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  const registeredUsers = new Map(); // email -> user data (used as cache if supabase exists)

  // Load users from file (Initial load or fallback)
  const loadUsersFromFile = () => {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, "utf-8");
        const usersArray = JSON.parse(data);
        usersArray.forEach(([email, user]: [string, any]) => {
          registeredUsers.set(email, user);
        });
        console.log(`Loaded ${registeredUsers.size} users from ${USERS_FILE}`);
      }
    } catch (err) {
      console.error("Error loading users from file:", err);
    }
  };

  loadUsersFromFile();

  const saveUser = async (user: any) => {
    registeredUsers.set(user.email, user);
    
    // Save to Supabase if available
    if (supabase) {
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

    // Always save to file as fallback/backup
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(registeredUsers.entries()), null, 2));
    } catch (err) {
      console.error("Error saving users to file:", err);
    }
  };

  const getUserByEmail = async (email: string) => {
    // Check cache first
    if (registeredUsers.has(email)) {
      return registeredUsers.get(email);
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
          registeredUsers.set(email, data); // Cache it
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
