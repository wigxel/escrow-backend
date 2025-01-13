import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";
import { userTable } from "./user-table";

export const transactionStatus = pgEnum("transaction_status", [
  "created",
  "awaiting terms conf",
  "terms confirmed",
  "deposit pending",
  "deposit confirmed",
  "awaiting service",
  "service completed",
  "service confirmation",
  "completed",
  "dispute",
  "refunded",
  "cancelled",
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
export const txPartiesStatus = pgEnum("tranaction_participants_status", ["active", "inactive"]);
export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
]);
export const invitationMethod = pgEnum("method", ["email", "phone", "link"]);

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const transactionTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title"),
  description: text("description"),
  status: transactionStatus("status").default("created"),
  createdBy: uuid("created_by").references(() => userTable.id),
  ...timestamps,
});

export const transactionPaymentTable = pgTable("transaction_payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id"),
  amount: numeric("amount", { precision: 2 }),
  fee: numeric("fee", { precision: 2 }),
  status: paymentStatus("status").default("pending"),
  method: paymentMethod("method"),
  ...timestamps,
});

export const transactionparticipantTable = pgTable(
  "transaction_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactionTable.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id),
    role: roles("roles").notNull(),
    status: txPartiesStatus("status").default("active"),
  },
  (table) => {
    return {
      transactionIdx: index("transaction_idx").on(table.transactionId),
      userIdx: index("user_idx").on(table.userId),
    };
  },
);

export const transactionTermsTable = pgTable(
  "transaction_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id").references(() => transactionTable.id),
    terms: text("terms"),
    ...timestamps,
  },
  (table) => {
    return {
      nameIdx: index("name_idx").on(table.transactionId),
    };
  },
);

export const transactionInvitationTable = pgTable("transaction_invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull(),
  senderId: uuid("sender_id"),
  receiverId: uuid("receiver_id"),
  role: roles("role"),
  token: varchar("token"),
  userId: uuid("user_id").notNull(),
  status: invitationStatus("status").default("pending"),
  method: invitationMethod("method"),
  ...timestamps,
});
