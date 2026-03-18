import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { connectRabbitMQ, publishOrderEvent } from './rabbitmq';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.ORDER_PORT || process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'UP', service: 'order-service', timestamp: new Date().toISOString() });
});

// ─── Get all orders (optionally filtered by userId) ────────────────────────
app.get('/api/orders', async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;
        const whereClause = userId ? { userId: String(userId) } : {};
        const orders = await prisma.order.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ─── Get ALL orders (admin) ────────────────────────────────────────────────
app.get('/api/orders/all', async (_req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ─── Get order by ID ───────────────────────────────────────────────────────
app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// ─── Create order ──────────────────────────────────────────────────────────
app.post('/api/orders', async (req: Request, res: Response) => {
    try {
        const { productId, productName, quantity, totalPrice, userId, customerEmail } = req.body;

        const order = await prisma.order.create({
            data: {
                productId: productId || 'unknown',
                productName: productName || 'Unknown Product',
                quantity: Number(quantity) || 1,
                totalPrice: Number(totalPrice) || 0,
                userId: userId || 'anonymous',
                customerEmail: customerEmail || '',
                status: 'PENDING',
            },
        });

        // Publish ORDER_PLACED event to RabbitMQ
        publishOrderEvent(order);
        console.log(`[ORDER_PLACED] Order ${order.id} created — publishing event`);

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// ─── Update order status ───────────────────────────────────────────────────
app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status },
        });

        // Publish ORDER_STATUS_CHANGED event to RabbitMQ
        publishOrderEvent({ ...order, eventType: 'ORDER_STATUS_CHANGED' });
        console.log(`[ORDER_STATUS_CHANGED] Order ${order.id} → ${status}`);

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// ─── Cancel order ──────────────────────────────────────────────────────────
app.patch('/api/orders/:id/cancel', async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'DISPATCHED') return res.status(400).json({ error: 'Cannot cancel a dispatched order' });
        if (order.status === 'CANCELLED') return res.status(400).json({ error: 'Order is already cancelled' });

        const updated = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: 'CANCELLED' },
        });

        // Publish ORDER_CANCELLED event
        publishOrderEvent({ ...updated, eventType: 'ORDER_CANCELLED' });
        console.log(`[ORDER_CANCELLED] Order ${updated.id} cancelled by user`);

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel order' });
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
