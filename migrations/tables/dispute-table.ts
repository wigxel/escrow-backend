import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userTable } from "./user-table";

export const disputeTable = pgTable("disputes", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by").references(() => userTable.id),
  creatorRole: varchar("creator_role"),
  acceptedBy: uuid("accepted_by"),
  resolvedBy: uuid("resolved_by"),
  reason: varchar("reason"),
  escrowId: uuid("escrow_id"),
  categoryId:integer("category_id"),
  resolutionId:integer("resolution_id"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const disputeMembersTable = pgTable("dispute_members", {
  id: serial("id").primaryKey(),
  disputeId: uuid("dispute_id"),
  userId: uuid("user_id"),
  role: varchar("role"),
});


export const disputeCategoriesTable = pgTable("dispute_categories", {
  id: serial("id").primaryKey(),
  name:varchar("name")
})

export const disputeResolutionTable = pgTable("dispute_resolutions", {
  id: serial("id").primaryKey(),
  name:varchar("name")
})
