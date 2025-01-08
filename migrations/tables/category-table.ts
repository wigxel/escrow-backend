import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const categoryTable = pgTable("category", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
});
