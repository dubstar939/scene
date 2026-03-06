import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;
  const USERS_FILE = path.join(__dirname, "users.json");

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  // Real-time state (in-memory for demo, use Redis/DB for production)
  const activeMembers = new Map();
  const registeredUsers = new Map(); // email -> user data

  // Load users from file
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
    console.error("Error loading users:", err);
  }

  const saveUsers = () => {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(registeredUsers.entries()), null, 2));
    } catch (err) {
      console.error("Error saving users:", err);
    }
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
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  apiRouter.post("/auth/email/signup", async (req, res) => {
    console.log("Signup attempt:", req.body.email);
    const { email, password, name, avatar } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (registeredUsers.has(email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: `email-${Date.now()}`,
        email,
        password: hashedPassword,
        name,
        avatar: avatar || `https://i.pravatar.cc/150?u=${email}`,
        car: 'New Member'
      };
      registeredUsers.set(email, newUser);
      saveUsers();
      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Error creating user" });
    }
  });

  apiRouter.post("/auth/email/login", async (req, res) => {
    const { email, password } = req.body;
    const user = registeredUsers.get(email);
    
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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_scene", (member) => {
      activeMembers.set(socket.id, member);
      io.emit("members_update", Array.from(activeMembers.values()));
    });

    socket.on("update_location", (data) => {
      const member = activeMembers.get(socket.id);
      if (member) {
        const updatedMember = { 
          ...member, 
          location: data.location, 
          lastSeen: new Date().toLocaleTimeString() 
        };
        activeMembers.set(socket.id, updatedMember);
        socket.broadcast.emit("member_moved", updatedMember);
      }
    });

    socket.on("send_message", (message) => {
      io.emit("new_message", message);
    });

    socket.on("disconnect", () => {
      activeMembers.delete(socket.id);
      io.emit("members_update", Array.from(activeMembers.values()));
      console.log("User disconnected:", socket.id);
    });
  });

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
