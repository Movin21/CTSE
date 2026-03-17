import * as amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import { io, logFeed } from './index';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE_NAME = 'order_events';

const prisma = new PrismaClient();

export async function startConsumer(): Promise<void> {
    const maxRetries = 15;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            const channel = await connection.createChannel();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            channel.prefetch(1);

            console.log(`[RabbitMQ] Waiting for messages in queue: ${QUEUE_NAME}`);

            channel.consume(QUEUE_NAME, async (msg: amqp.ConsumeMessage | null) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        const orderData = content.data;
                        const eventType = content.event || 'ORDER_PLACED';

                        console.log(`[RabbitMQ] Received event: ${eventType}`, orderData);

                        // Store notification in database
                        const notification = await prisma.notification.create({
                            data: {
                                orderId: orderData.id,
                                eventType,
                                message: `Order #${orderData.id.substring(0, 8)} placed — ${orderData.productName || 'Product'} x${orderData.quantity} (${orderData.status})`,
                                customerEmail: orderData.customerEmail || '',
                            },
                        });

                        // Build log entry
                        const logEntry = {
                            message: notification.message,
                            timestamp: new Date().toISOString(),
                            orderId: orderData.id,
                            eventType,
                        };

                        // Prepend to in-memory log (keep last 100)
                        logFeed.unshift(logEntry);
                        if (logFeed.length > 100) logFeed.pop();

                        // Push real-time event via Socket.io
                        io.emit('notification:new', {
                            ...notification,
                            ...logEntry,
                        });

                        console.log(`[Socket.io] Event broadcast: notification:new — ${notification.id}`);
                        channel.ack(msg);
                    } catch (err) {
                        console.error('[RabbitMQ] Error processing message:', err);
                        channel.nack(msg, false, true);
                    }
                }
            });

            return;
        } catch (err) {
            console.log(`[RabbitMQ] Connection attempt ${i + 1}/${maxRetries} failed. Retrying in 5s...`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    throw new Error('[RabbitMQ] Failed to connect after maximum retries');
}
