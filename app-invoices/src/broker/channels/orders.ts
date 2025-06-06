import {broker} from "../broker.ts";

export const orders = await broker.createChannel();

// await order.assertExchange('orders', 'direct', {durable: true});
await orders.assertQueue('orders');
// await order.bindQueue('orders', 'orders', 'orders');