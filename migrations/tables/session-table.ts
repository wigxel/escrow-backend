import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userTable } from "../../migrations/tables/user-table";

export const sessionUser = pgTable("session", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
