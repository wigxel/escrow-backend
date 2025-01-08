import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const addressTable = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  // TODO: RENAME TO `entity_id`
  userId: uuid("user_id"),
  placeId: varchar("place_id"),
  street: varchar("street").notNull(),
  city: varchar("city").notNull(),
  zipCode: varchar("zip_code").default("N/A").notNull(),
  state: varchar("state").notNull(),
  country: varchar("country").default("N/A").notNull(),
  longitude: varchar("longitude"),
  latitude: varchar("latitude"),
});
