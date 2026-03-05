import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

  // Real-time state (in-memory for demo, use Redis/DB for production)
  const activeMembers = new Map();
  const registeredUsers = new Map(); // email -> user data

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

  // API routes
  app.use(express.json({ limit: '5mb' }));

  app.post("/api/auth/email/signup", (req, res) => {
    const { email, password, name, avatar } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (registeredUsers.has(email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser = {
      id: `email-${Date.now()}`,
      email,
      password, // In real app, hash this!
      name,
      avatar: avatar || `https://i.pravatar.cc/150?u=${email}`,
      car: 'New Member'
    };
    registeredUsers.set(email, newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/email/login", (req, res) => {
    const { email, password } = req.body;
    const user = registeredUsers.get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
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
