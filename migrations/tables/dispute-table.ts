import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userTable } from "./user-table";

export const disputeTable = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by").references(() => userTable.id),
  creatorRole: varchar("creator_role"),
  acceptedBy: uuid("accepted_by"),
  resolvedBy: uuid("resolved_by"),
  reason: varchar("reason"),
  orderId: uuid("order_id"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputeMembersTable = pgTable("dispute_members", {
  id: serial("id").primaryKey(),
  disputeId: uuid("dispute_id"),
  userId: uuid("user_id"),
  role: varchar("role"),
});

export const disputeMessageTable = pgTable("dispute_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  disputeId: uuid("dispute_id"),
  senderId: uuid("sender_id"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputeReadReceiptTable = pgTable("dispute_read_receipt", {
  id: serial("id").primaryKey(),
  disputeId: uuid("dispute_id"),
  userId: uuid("user_id"),
  lastReadCount: integer("last_read_count"),
  readAt: timestamp("read_at").defaultNow(),
});
