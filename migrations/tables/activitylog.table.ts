import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const activityLogTable = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // e.g. Order, Product, Auth, Profile
  kind: varchar("entity_kind", { length: 20 }).notNull(),
  // e.g. the ide of the ORDER entity
  entityId: uuid("entity_id").notNull(),
  data: jsonb("data").notNull().default({}),
  createdAt: timestamp("created_at",{withTimezone:true,precision:6}).defaultNow(),
});
