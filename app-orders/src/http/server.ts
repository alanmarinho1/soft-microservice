import { fastify } from "fastify";
import { z } from "zod";
import { fastifyCors } from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { channels } from "../broker/channels/index.ts";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/indes.ts";
import { dispathOrderCreated } from "../broker/messages/order-created.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
  origin: "*",
});

app.get("/health", () => {
  return { status: "ok" };
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;

    console.log("Creating an order with amount", amount);
    const orderId = crypto.randomUUID();
    dispathOrderCreated({
        orderId,
        amount,
        customerId: {
            id: '696e81ad-184a-471c-a6b1-ae254186ffb1'
        }
    })

    
    await db.insert(schema.orders).values({ 
        id: orderId,
        custumerId: '696e81ad-184a-471c-a6b1-ae254186ffb1',
        amount,
     });
    return reply.status(201).send({ amount });
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] HTTP server running!");
});
