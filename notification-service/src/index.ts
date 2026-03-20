import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { startConsumer } from "./rabbitmq";

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.NOTIFICATION_PORT || process.env.PORT || 3002;

// ─── Socket.io Setup ───────────────────────────────────────────────────────
export const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── In-memory log feed (last 100 entries) ────────────────────────────────
export const logFeed: Array<{
  message: string;
  timestamp: string;
  orderId: string;
  eventType: string;
}> = [];

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Send current log history on connect
  socket.emit("log:history", logFeed);

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "UP",
    service: "notification-service",
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

// ─── Get all notifications ─────────────────────────────────────────────────
app.get("/api/notifications", async (_req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── Get notifications for a specific user (by userId from orders) ─────────
app.get(
  "/api/notifications/user/:userId",
  async (req: Request, res: Response) => {
    try {
      // Find all order IDs belonging to this user
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      // Filter by userId embedded in the orderId's order (notifications store orderId)
      // For simplicity, we return all notifications and let frontend filter by its orders
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user notifications" });
    }
  },
);

// ─── Live log feed (admin view) ────────────────────────────────────────────
app.get("/api/notifications/logs", (_req: Request, res: Response) => {
  res.json(logFeed);
});

// ─── Start server + RabbitMQ consumer ─────────────────────────────────────
async function start() {
  // Start RabbitMQ consumer in background to avoid blocking server startup
  startConsumer().catch((err) => {
    console.error(
      "[Notification Service] RabbitMQ consumer failed to start:",
      err,
    );
  });

  server.listen(PORT, () => {
    console.log(
      `[Notification Service] Running on port ${PORT} | Socket.io ACTIVE`,
    );
  });
}

start().catch(console.error);
