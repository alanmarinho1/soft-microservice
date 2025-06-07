import "@opentelemetry/auto-instrumentations-node/register";

import { fastify } from "fastify";
import { z } from "zod";
import { fastifyCors } from "@fastify/cors";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/indes.ts";
import { dispathOrderCreated } from "../broker/messages/order-created.ts";
import { trace } from "@opentelemetry/api";
import { setTimeout } from "node:timers/promises";
import { tracer } from "../tracer/tracer.ts";

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

    await db.insert(schema.orders).values({
      id: orderId,
      custumerId: "696e81ad-184a-471c-a6b1-ae254186ffb1",
      amount,
    });

    const span = tracer.startSpan("Deve está lento nessa parte");
    span.setAttribute("teste", "Hello World");
    await setTimeout(3000);
    span.end();

    trace.getActiveSpan()?.setAttribute("order_id", orderId); // destacar algum atributo no trace

    dispathOrderCreated({
      orderId,
      amount,
      customerId: {
        id: "696e81ad-184a-471c-a6b1-ae254186ffb1",
      },
    });
    return reply.status(201).send({ amount });
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] HTTP server running!");
});
