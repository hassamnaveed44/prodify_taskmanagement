const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");
const { PrismaClient } = require("@prisma/client");
const cookie = require("cookie");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Helper to get name initials
function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper to get consistent background colors
function getAuthorColor(name) {
  const colors = [
    "bg-indigo-600",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-blue-505",
  ];
  const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length] || "bg-slate-400";
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request on", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  // Store globally so standard API endpoints can trigger real-time notifications
  global.wss = wss;

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url || "", true);

    if (pathname === "/api/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (ws, request) => {
    console.log("⚡ Client connected to WebSockets");

    // Retrieve access token from cookies if present
    const parsedCookies = cookie.parse(request.headers.cookie || "");
    const token = parsedCookies.accessToken;

    let sessionUserId = null;
    let sessionUserName = "Teammate";

    if (token) {
      try {
        // Base64 decode JWT payload since it's signed but readable
        const tokenParts = token.split(".");
        if (tokenParts[1]) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString("utf-8"));
          sessionUserId = payload.userId;
          sessionUserName = payload.name || "Teammate";
        }
      } catch (err) {
        console.error("Failed to decode connection token:", err);
      }
    }

    ws.on("message", async (message) => {
      try {
        const packet = JSON.parse(message.toString());

        if (packet.type === "message" && packet.teamId && packet.authorId && packet.content) {
          // Write to Postgres using Prisma
          const createdMessage = await prisma.message.create({
            data: {
              teamId: packet.teamId,
              authorId: packet.authorId,
              content: packet.content,
            },
            include: {
              author: {
                include: { user: true },
              },
            },
          });

          // Format broadcast packet
          const broadcastData = JSON.stringify({
            type: "message",
            message: {
              id: createdMessage.id,
              teamId: createdMessage.teamId,
              authorId: createdMessage.authorId,
              content: createdMessage.content,
              createdAt: createdMessage.createdAt,
              authorName: createdMessage.author.user.name,
              authorInitials: getInitials(createdMessage.author.user.name),
              authorColor: getAuthorColor(createdMessage.author.user.name),
            },
          });

          // Broadcast to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === 1) { // OPEN
              client.send(broadcastData);
            }
          });
        }
      } catch (err) {
        console.error("Error processing websocket message:", err);
      }
    });

    ws.on("close", () => {
      console.log("🔌 Client disconnected from WebSockets");
    });
  });

  server.once("error", (err) => {
    console.error("Server startup error:", err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
