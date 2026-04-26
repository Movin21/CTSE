import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import axios from 'axios';

const app = express();
const port = process.env.ADMIN_PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Get internal URLs from env, with fallbacks
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:8081';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';

// Health check
app.get('/api/admin/health', (req: Request, res: Response) => {
    res.json({ status: 'UP', service: 'admin-service' });
});

// ─── ADMIN ENDPOINTS (BFF) ──────────────────────────────────────────────────

// 1. Get all orders (Proxy to Order Service)
app.get('/api/admin/orders', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/all`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('Failed to fetch orders from order-service:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error || 'Failed to fetch admin orders';
        res.status(status).json({ error: message });
    }
});

// 2. Change order status (Proxy to Order Service)
app.patch('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await axios.patch(`${ORDER_SERVICE_URL}/api/orders/${id}/status`, req.body, {
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('Failed to update order status natively:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error || 'Failed to update order status';
        res.status(status).json({ error: message });
    }
});

// 3. Register a new Admin (Proxy to Identity Service)
app.post('/api/admin/register', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(`${IDENTITY_SERVICE_URL}/api/auth/register/admin`, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('Failed to register admin natively:', error.message);
        const status = error.response?.status || 500;
        const errorData = error.response?.data;
        const message = typeof errorData === 'string'
            ? errorData
            : errorData?.error || errorData?.message || 'Failed to register admin';
        res.status(status).json({ error: message });
    }
});

app.listen(port, () => {
    console.log(`[Admin Service] Running on port ${port} as API Orchestrator`);
});
