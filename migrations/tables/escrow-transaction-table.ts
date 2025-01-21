import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  numeric,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { userTable } from "./user-table";

export const escrowStatus = pgEnum("escrow_status", [
  "created",
  "deposit pending",
  "deposit confirmed",
  "awaiting service",
  "service completed",
  "service confirmation",
  "completed",
  "dispute",
  "refunded",
  "cancelled",
  "expired",
]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "success",
  "cancelled",
  "failed",
]);
export const paymentMethod = pgEnum("payment_method", [
  "credit card",
  "bank transfer",
]);
export const roles = pgEnum("roles", ["buyer", "seller", "mediator"]);
export const participantStatus = pgEnum("escrow_participants_status", [
  "active",
  "inactive",
]);
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
]);

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const escrowTransactionTable = pgTable("escrow_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title"),
  description: text("description"),
  status: escrowStatus("status").default("created"),
  createdBy: uuid("created_by").references(() => userTable.id),
  ...timestamps,
});

export const escrowPaymentTable = pgTable("escrow_payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id"),
  userId: uuid("user_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 10, scale: 2 }),
  status: paymentStatus("status").default("pending"),
  method: paymentMethod("method"),
  ...timestamps,
});

export const escrowTermsTable = pgTable(
  "escrow_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escrowId: uuid("escrow_id").references(() => escrowTransactionTable.id),
    terms: text("terms"),
    ...timestamps,
  },
  (table) => {
    return {
      nameIdx: index("name_idx").on(table.escrowId),
    };
  },
);

export const escrowParticipantsTable = pgTable("escrow_participants", {
  escrowId: uuid("escrow_id").primaryKey(),
  userId: uuid("user_id"),
  role: roles("role"),
  status: participantStatus("status"),
});

export const escrowRequestTable = pgTable("escrow_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id").notNull(),
  senderId: uuid("sender_id"),
  customerId: uuid("customer_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  customerRole: roles("customer_role"),
  customerName: varchar("customer_name"),
  customerPhone: varchar("customer_phone"),
  customerEmail: varchar("customer_email"),
  status: invitationStatus("status").default("pending"),
  accessCode:varchar("access-code"),
  authorizationUrl:text("authorization_url"),
  expires_at: timestamp("expires_at"),
  ...timestamps,
});
