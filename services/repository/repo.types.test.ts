import { Expect, Equal } from "type-testing";
import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { DrizzleRepo } from "~/services/repository/RepoHelper";
import { InferResult } from "../effect.util";

//////// SCHEMA
const table = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 60 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

class FuelRepo extends DrizzleRepo(table, "id") {}

type SelectType = typeof table.$inferSelect;

const repo = new FuelRepo();

test(".find without an array should return a single record", () => {
  const data = repo.find(1);

  type ManyType = InferResult<typeof data>;
  type Assert = Expect<Equal<ManyType, SelectType>>;
});

test(".find with an array should return a many record", () => {
  const many = repo.find([1, 2, 3]);

  type ManyType = InferResult<typeof many>;
  type Assert = Expect<Equal<ManyType, SelectType[]>>;
});

const single = repo.find(1);

repo.find("emailVerified", true);
repo.firstOrThrow("firstName", "1");
repo.firstOrThrow(1);
repo.find("emailVerified", "12");
