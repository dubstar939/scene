import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

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

  // Google Auth Setup
  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

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

  app.get("/api/auth/google/url", (req, res) => {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/google/callback`;
    
    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      redirect_uri: redirectUri
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/google/callback`;

    try {
      const { tokens } = await googleClient.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });
      googleClient.setCredentials(tokens);

      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }).then(r => r.json());

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  provider: 'google',
                  user: {
                    id: '${userInfo.sub}',
                    name: '${userInfo.name}',
                    picture: { data: { url: '${userInfo.picture}' } }
                  }
                }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).send(`Google Auth Error: ${err.message}`);
    }
  });

  app.get("/api/auth/facebook/url", (req, res) => {
    const appId = process.env.FACEBOOK_APP_ID;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/facebook/callback`;

    if (!appId) {
      return res.status(500).json({ error: "FACEBOOK_APP_ID not configured" });
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state: "facebook_auth_state", // In a real app, use a secure random string
      scope: "public_profile,email",
      response_type: "code",
    });

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get("/auth/facebook/callback", async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
                window.close();
              }
            </script>
            <p>Authentication failed: ${error}</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const redirectUri = `${appUrl}/auth/facebook/callback`;

      // Exchange code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(tokenData.error.message);
      }

      const accessToken = tokenData.access_token;

      // Get user data
      const userResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,picture.type(large)&access_token=${accessToken}`
      );
      const userData = await userResponse.json();

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify(userData)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Facebook Auth Error:", err);
      res.status(500).send(`Authentication error: ${err.message}`);
    }
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
