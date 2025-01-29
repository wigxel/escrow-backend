import { relations } from "drizzle-orm";

import {
  disputeMembersTable,
  disputeTable,
} from "~/migrations/tables/dispute-table";

import { userTable } from "~/migrations/tables/user-table";
import { addressTable } from "./address-table";
import { escrowParticipantsTable, escrowPaymentTable, escrowTransactionTable, escrowWalletTable } from "./escrow-transaction-table";

export const userRelations = relations(userTable, ({ one,many }) => ({
  address:one(addressTable,{
    fields:[userTable.id],
    references:[addressTable.userId]
  }),
}));

export const escrowRelations = relations(escrowTransactionTable,({one,many})=>({
  paymentDetails:one(escrowPaymentTable, {
    fields:[escrowTransactionTable.id],
    references:[escrowPaymentTable.escrowId]
  }),
  escrowWalletDetails:one(escrowWalletTable,{
    fields:[escrowTransactionTable.id],
    references:[escrowWalletTable.escrowId]
  }),
  participants:many(escrowParticipantsTable),

}))

export const participantRelations = relations(escrowParticipantsTable,({one})=>({
  transactionDetails: one(escrowTransactionTable,{
    fields:[escrowParticipantsTable.escrowId],
    references:[escrowTransactionTable.id]
  })
}))


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
