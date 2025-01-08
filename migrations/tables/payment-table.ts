import {
  numeric,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const paymentStatus = pgEnum("paymentStatus", [
  "pending",
  "success",
  "rejected",
]);

export const paymentDetailsTable = pgTable("payment_details", {
  paymentId: uuid("payment_id").primaryKey().defaultRandom(),
  amount: numeric("total", { precision: 10, scale: 2 }),
  provider: varchar("provider"),
  paymentType: varchar("payment_type"),
  status: paymentStatus("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentOrderTable = pgTable("payment_order", {
  id: serial("id").primaryKey(),
  paymentId: uuid("payment_id"),
  orderId: uuid("order_id"),
});
