require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 8080;

// ─── General Middleware ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200000, // INCREASED to allow frontend dashboard health checks
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

app.use(morgan("combined"));

// ─── Health check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
});

// ─── Proxy configuration ────────────────────────────────────────────────────
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`[PROXY ERROR] ${err.message}`);
      res.status(502).json({ error: "Service temporarily unavailable" });
    },
  },
});

// Auth / Identity Service (Spring Boot :8081)
app.use(
  createProxyMiddleware("/api/auth", {
    ...proxyOptions(
      process.env.IDENTITY_SERVICE_URL || "http://identity-service:8081",
    ),
  }),
);

// Users (also Identity Service)
app.use(
  createProxyMiddleware("/api/users", {
    ...proxyOptions(
      process.env.IDENTITY_SERVICE_URL || "http://identity-service:8081",
    ),
  }),
);

// Products (Spring Boot :8082)
app.use(
  createProxyMiddleware("/api/products", {
    ...proxyOptions(
      process.env.PRODUCT_SERVICE_URL || "http://product-service:8082",
    ),
  }),
);

// Orders (Node/TS :3001)
app.use(
  createProxyMiddleware("/api/orders", {
    ...proxyOptions(
      process.env.ORDER_SERVICE_URL || "http://order-service:3001",
    ),
  }),
);

// Notifications (Node/TS :3002)
app.use(
  createProxyMiddleware("/api/notifications", {
    ...proxyOptions(
      process.env.NOTIFICATION_SERVICE_URL ||
        "http://notification-service:3002",
    ),
  }),
);

// Admin Service (Node/TS :3003)
app.use(
  createProxyMiddleware("/api/admin", {
    ...proxyOptions(
      process.env.ADMIN_SERVICE_URL || "http://admin-service:3003",
    ),
  }),
);

// Socket.io passthrough (WebSocket upgrade for /socket.io)
const socketIOProxy = createProxyMiddleware("/socket.io", {
  target:
    process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3002",
  changeOrigin: true,
  ws: true,
  on: {
    error: (err, req, res) => {
      console.error(`[PROXY ERROR - socket.io] ${err.message}`);
      if (res && res.writeHead) {
        res.status(502).json({ error: "Service temporarily unavailable" });
      }
    },
  },
});
app.use(socketIOProxy);

// ─── Actuator health for identity & product (pass-through for dashboard) ───
app.use(
  createProxyMiddleware("/actuator", {
    ...proxyOptions(
      process.env.IDENTITY_SERVICE_URL || "http://identity-service:8081",
    ),
  }),
);

// ─── 404 fallback ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

const server = app.listen(PORT, () => {
  console.log(
    `[API Gateway] Running on port ${PORT} — Security: helmet + rate-limit ACTIVE`,
  );
});

// Forward WebSocket upgrade events to the Socket.io proxy
server.on("upgrade", socketIOProxy.upgrade);
