import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  serial,
  smallint,
  smallserial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./escrow-transaction-table";

export const memberRole = pgEnum("role", ["admin", "user"]);

export const userTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 60 }).notNull(),
    lastName: varchar("last_name", { length: 60 }).notNull(),
    username: varchar("username"),
    email: varchar("email", { length: 60 }).notNull(),
    bvn: varchar("bvn"),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    role: memberRole("role").default("user").notNull(),
    profilePicture: text("profile_picture"),
    emailVerified: boolean("email_verified").default(false),
    hasBusiness: boolean("has_business").default(false),
    businessName: varchar("business_name"),
    businessType: varchar("business-type"),
    referralSourceId: smallint("referral_source_id"),
    ...timestamps
  },
  (table) => {
    return {
      emailIndex: uniqueIndex("emailIndex").on(table.email),
    };
  },
);

export const bankAccountTable = pgTable("bank_account", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tigerbeetleAccountId: varchar("tigerbeetle_account_id").notNull(),
  bankName: varchar("bank_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  isDefault: boolean("is_default").default(false),
  accountName: varchar("account_name"),
  bankCode: varchar("bank_code"),
  paystackRecipientCode: varchar("paystack_recipient_code"),
  deletedAt: timestamp("deleted_at",{withTimezone:true,precision:6}),
  ...timestamps,
});

export const bankAccountVerificationTable = pgTable(
  "bank_account_verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountNumber: varchar("account_number").notNull(),
    accountName: varchar("account_name"),
    bankName: varchar("bank_name"),
    bankCode: varchar("bank_code"),
    verificationToken: uuid("verificationToken"),
    expiresAt: timestamp("expires_at",{withTimezone:true,precision:6}).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      verificationTokenIndex: uniqueIndex("verification_token_index").on(
        table.verificationToken,
      ),
    };
  },
);

export const withdrawalTable = pgTable("withdrawal", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  status: varchar("status"),
  referenceCode: varchar("reference_code"),
  tigerbeetleTransferId: varchar("tigerbeetle_transfer_id"),
  ...timestamps,
});

/**
 * stores the various ways the company was heard of
 */
export const referralSourceTable = pgTable("referral_resource", {
  id: smallserial("id"),
  name: varchar("name"),
});


export const pushTokenTable = pgTable("push_token", {
  id: serial("id").primaryKey(),
  userId: uuid("userId"),
  token: text("token"),
  ...timestamps,
});

