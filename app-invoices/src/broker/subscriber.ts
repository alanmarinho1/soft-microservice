import { orders } from "./channels/orders.ts";

orders.consume('orders', async (msg) => {
    if (!msg) {
        return null;
    }
    console.log(msg?.content.toString());

    orders.ack(msg);
}, {
    noAck: false
});

// noAck quer dizer que a mensagem não será removida do queue