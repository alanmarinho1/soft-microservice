import { pgEnum } from "drizzle-orm/pg-core"
import { pgTable, integer, timestamp, text } from "drizzle-orm/pg-core"
import { customers } from "./custumers.ts"

export const orderStatusEnum = pgEnum('order_status', [
    'pending',
    'paid',
    'cancelled'
])
export const orders = pgTable('orders', {
    id: text().primaryKey(),
    custumerId: text().notNull().references(() => customers.id),
    amount: integer().notNull(),
    status: orderStatusEnum().notNull().default('pending'),
    createdAt: timestamp().notNull().defaultNow(),
})