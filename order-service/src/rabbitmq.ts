import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE_NAME = 'order_events';

let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            console.log('Connected to RabbitMQ');
            return;
        } catch (err) {
            console.log(`RabbitMQ connection attempt ${i + 1}/${maxRetries} failed. Retrying in 5s...`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    throw new Error('Failed to connect to RabbitMQ after maximum retries');
}

export function publishOrderEvent(order: object): boolean {
    if (!channel) {
        console.error('RabbitMQ channel not initialized');
        return false;
    }
    const message = JSON.stringify({ event: 'order.created', data: order, timestamp: new Date().toISOString() });
    return channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
}
