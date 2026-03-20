import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import { connectRabbitMQ, publishOrderEvent } from "./rabbitmq";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.ORDER_PORT || process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────
app.get("/api/orders/health", (_req: Request, res: Response) => {
  res.json({
    status: "UP",
    service: "order-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "UP",
    service: "order-service",
    timestamp: new Date().toISOString(),
  });
});

// ─── Get all orders (optionally filtered by userId) ────────────────────────
app.get("/api/orders", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId: String(userId) } : {};
    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── Get ALL orders (admin) ────────────────────────────────────────────────
app.get("/api/orders/all", async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── Get order by ID ───────────────────────────────────────────────────────
app.get("/api/orders/:id", async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ─── Create order ──────────────────────────────────────────────────────────
app.post("/api/orders", async (req: Request, res: Response) => {
  try {
    const { productId, quantity, userId, customerEmail } = req.body;
    const requestedQty = Number(quantity) || 1;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // 1. Fetch authentic product details from Product Service synchronously
    let productData: any;
    try {
      const productResponse = await fetch(
        `http://product-service:8082/api/products/${productId}`,
      );
      if (!productResponse.ok) throw new Error("Product returned non-200");
      productData = await productResponse.json();
    } catch (err: any) {
      console.error(
        "Failed to fetch product from product-service:",
        err.message,
      );
      return res
        .status(404)
        .json({ error: "Product not found or unavailable" });
    }

    if (productData.stockQuantity < requestedQty) {
      return res
        .status(400)
        .json({
          error: `Insufficient stock. Only ${productData.stockQuantity} remaining.`,
        });
    }

    // 2. Calculate true total price to prevent client-side spoofing
    const authenticPrice = Number(productData.price);
    const authenticTotalPrice = authenticPrice * requestedQty;

    // 3. Deduct stock synchronously via Product Service
    try {
      const patchRes = await fetch(
        `http://product-service:8082/api/products/${productId}/deduct-stock?quantity=${requestedQty}`,
        { method: "PATCH" },
      );
      if (!patchRes.ok) throw new Error("Patch returned non-200");
    } catch (err: any) {
      console.error("Failed to deduct stock:", err.message);
      return res
        .status(400)
        .json({ error: "Failed to reserve stock. It may have sold out." });
    }

    // 4. Create Order in the local database
    const order = await prisma.order.create({
      data: {
        productId: productData.id,
        productName: productData.name,
        quantity: requestedQty,
        totalPrice: authenticTotalPrice,
        userId: userId || "anonymous",
        customerEmail: customerEmail || "",
        status: "PENDING",
      },
    });

    // Publish ORDER_PLACED event to RabbitMQ
    publishOrderEvent({ ...order, eventType: "ORDER_PLACED" });
    console.log(`[ORDER_PLACED] Order ${order.id} created — publishing event`);

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ error: "Failed to create order due to an internal error" });
  }
});

// ─── Update order status ───────────────────────────────────────────────────
app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    // If an admin is cancelling the order, restore the stock
    if (status === "CANCELLED") {
      const currentOrder = await prisma.order.findUnique({
        where: { id: req.params.id },
      });
      if (currentOrder && currentOrder.status !== "CANCELLED") {
        try {
          const patchRes = await fetch(
            `http://product-service:8082/api/products/${currentOrder.productId}/add-stock?quantity=${currentOrder.quantity}`,
            { method: "PATCH" },
          );
          if (!patchRes.ok)
            console.error(
              "Product Service returned non-200 while adding stock",
            );
        } catch (err: any) {
          console.error(
            "Failed to communicate with product-service for restocking:",
            err.message,
          );
        }
      }
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Publish ORDER_STATUS_CHANGED event to RabbitMQ
    publishOrderEvent({ ...order, eventType: "ORDER_STATUS_CHANGED" });
    console.log(`[ORDER_STATUS_CHANGED] Order ${order.id} → ${status}`);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ─── Cancel order ──────────────────────────────────────────────────────────
app.patch("/api/orders/:id/cancel", async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "DISPATCHED")
      return res
        .status(400)
        .json({ error: "Cannot cancel a dispatched order" });
    if (order.status === "CANCELLED")
      return res.status(400).json({ error: "Order is already cancelled" });

    // Restore stock when user cancels order
    try {
      const patchRes = await fetch(
        `http://product-service:8082/api/products/${order.productId}/add-stock?quantity=${order.quantity}`,
        { method: "PATCH" },
      );
      if (!patchRes.ok)
        console.error("Product Service returned non-200 while adding stock");
    } catch (err: any) {
      console.error(
        "Failed to communicate with product-service for restocking:",
        err.message,
      );
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    // Publish ORDER_CANCELLED event
    publishOrderEvent({ ...updated, eventType: "ORDER_CANCELLED" });
    console.log(`[ORDER_CANCELLED] Order ${updated.id} cancelled by user`);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────
async function start() {
  await connectRabbitMQ();
  app.listen(PORT, () => {
    console.log(`[Order Service] Running on port ${PORT}`);
  });
}

start().catch(console.error);
