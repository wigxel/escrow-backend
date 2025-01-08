import { pgEnum, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const otpReason = pgEnum("otp_reason", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
]);

export const otpTable = pgTable("otp", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  userKind: text("user_kind").notNull(), // refers to the table
  value: varchar("value", { length: 6 }),
  otpReason: otpReason("otp_reason").default("EMAIL_VERIFICATION").notNull(),
});
