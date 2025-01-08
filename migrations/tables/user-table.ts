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

export const memberRole = pgEnum("role", ["ADMIN", "SELLER", "BUYER"]);

export const userTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 60 }).notNull(),
    lastName: varchar("last_name", { length: 60 }).notNull(),
    email: varchar("email", { length: 60 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    role: memberRole("role").default("BUYER").notNull(),
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
