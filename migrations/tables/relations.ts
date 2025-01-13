import { relations } from "drizzle-orm";

import {
  disputeMembersTable,
  disputeTable,
} from "~/migrations/tables/dispute-table";

import { userTable } from "~/migrations/tables/user-table";
import { addressTable } from "./address-table";

export const userRelations = relations(userTable, ({ one,many }) => ({
  address:one(addressTable,{
    fields:[userTable.id],
    references:[addressTable.userId]
  }),
}));


export const disputeTableRelations = relations(disputeTable, ({ many }) => ({
  members: many(disputeMembersTable),
}));

export const disputeMembersTableRelations = relations(
  disputeMembersTable,
  ({ one, many }) => ({
    dispute: one(disputeTable, {
      fields: [disputeMembersTable.disputeId],
      references: [disputeTable.id],
    }),
    user: one(userTable, {
      fields: [disputeMembersTable.userId],
      references: [userTable.id],
    }),
  }),
);
