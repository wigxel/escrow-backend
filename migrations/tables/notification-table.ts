import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userTable } from "./user-table";

export const notificationTable = pgTable("notification", {
  id: serial("id").primaryKey(),
  tag: varchar("tag"),
  meta: text("meta").default("{}"),
  userId: uuid("user_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  title: varchar("title"),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
