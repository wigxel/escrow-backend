import {
  boolean,
  pgEnum,
  pgTable,
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  ...timestamps,
});

export const bankAccountVerificationTable = pgTable(
  "bank_account_verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountNumber: varchar("account_number").notNull(),
    accountName: varchar("account_name"),
    bankName: varchar("bank_name").notNull(),
    bankCode: varchar("bank_code"),
    verificationToken: uuid("verificationToken"),
    expiresAt: timestamp("expires_at").defaultNow().notNull(),
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
