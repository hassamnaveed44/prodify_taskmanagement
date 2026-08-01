const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");
const { PrismaClient } = require("@prisma/client");

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
    "bg-indigo-650",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-blue-500",
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

  // Initialize WebSocket Server on a separate, dedicated port (3001)
  // This isolates WebSockets from Next.js HMR upgrades, preventing connection blocks.
  const wss = new WebSocketServer({ port: 3001 });
  console.log(`> ⚡ WebSocket Server listening on ws://localhost:3001`);

  // Store globally so REST endpoints can query it
  global.wss = wss;

  wss.on("connection", async (ws) => {
    console.log("🔌 Client established connection to WebSockets");

    ws.on("message", async (message) => {
      try {
        const packet = JSON.parse(message.toString());

        // Handle joining/registering the socket in a specific room/workspace
        if (packet.type === "join") {
          ws.userId = packet.userId;
          ws.workspaceId = packet.workspaceId;
          ws.teamId = packet.teamId;
          console.log(`👤 User member [${ws.userId}] joined room [${ws.teamId}] in workspace [${ws.workspaceId}]`);
          return;
        }

        // Handle text message broadcasts
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

          // Broadcast strictly to clients registered in this specific team room
          wss.clients.forEach((client) => {
            if (client.readyState === 1 && client.teamId === packet.teamId) {
              client.send(broadcastData);
            }
          });
        } 
        
        // Handle typing status updates
        else if (packet.type === "typing" && packet.teamId) {
          const typingBroadcast = JSON.stringify({
            type: "typing",
            teamId: packet.teamId,
            authorId: packet.authorId,
            authorName: packet.authorName,
            isTyping: packet.isTyping,
          });

          // Broadcast only to other clients viewing the same team room
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1 && client.teamId === packet.teamId) {
              client.send(typingBroadcast);
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
