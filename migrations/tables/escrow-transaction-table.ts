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
import { table } from "effect/Console";

export const escrowStatus = pgEnum("escrow_status", [
  "created",
  "deposit.pending",
  "deposit.success",
  "service.pending",
  "service.confirmed",
  "completed",
  "dispute",
  "refunded",
  "cancelled",
  "expired",
]);

export const statementType = pgEnum("statement_type", [
  "escrow.deposit",
  "wallet.deposit",
  "wallet.withdraw",
]);

export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "success",
  "cancelled",
  "failed",
]);

export const AccountStatementStatus = pgEnum("account_statement_status", [
  "pending",
  "completed",
  "failed",
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

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
};

export const escrowTransactionTable = pgTable("escrow_transactions", {
  kind: varchar("kind", { length: 255 }).default("escrow_tx"),
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
  fee: numeric("fee", { precision: 10, scale: 2 }).default("0"),
  status: paymentStatus("status").default("pending"),
  method: varchar("method"),
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
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id"),
  userId: uuid("user_id"),
  role: roles("role"),
  status: participantStatus("status").default("active"),
});

export const escrowRequestTable = pgTable(
  "escrow_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escrowId: uuid("escrow_id").notNull(),
    senderId: uuid("sender_id"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    customerRole: roles("customer_role"),
    customerUsername: varchar("customer_username"),
    customerPhone: varchar("customer_phone"),
    customerEmail: varchar("customer_email"),
    status: invitationStatus("status").default("pending"),
    accessCode: varchar("access-code"),
    authorizationUrl: text("authorization_url"),
    expiresAt: timestamp("expires_at", { withTimezone: true, precision: 6 }),
    processedAt: timestamp("processed_at", {
      withTimezone: true,
      precision: 6,
    }),
    ...timestamps,
  },
  (table) => {
    return {
      expiresProcessedAtIdx: index("expires_processed_at_Idx").on(
        table.expiresAt,table.processedAt
      ),
    };
  },
);

export const escrowWalletTable = pgTable("escrow_wallet", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id"),
  tigerbeetleAccountId: varchar("tigerbeetle_account_id"),
  ...timestamps,
});
export const userWalletTable = pgTable("user_wallet", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  tigerbeetleAccountId: varchar("tigerbeetle_account_id"),
});

export const AccountStatementTable = pgTable("account_statement", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id"),
  relatedUserId: uuid("related_user_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  balance: numeric("balance", { precision: 10, scale: 2 }),
  type: statementType("type"),
  tigerbeetleTransferId: varchar("tigerbeetle_transfer_id"),
  status: AccountStatementStatus("status").default("completed"),
  metadata: text("metadata"),
  ...timestamps,
});
