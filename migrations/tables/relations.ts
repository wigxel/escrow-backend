import { relations } from "drizzle-orm";

import {
  disputeMembersTable,
  disputeTable,
} from "~/migrations/tables/dispute-table";

import { userTable } from "~/migrations/tables/user-table";
import { addressTable } from "./address-table";
import {
  escrowParticipantsTable,
  escrowPaymentTable,
  escrowTransactionTable,
  escrowWalletTable,
} from "./escrow-transaction-table";
import { activityLogTable } from "./activitylog.table";
import { reviewsTable } from "./review-table";

export const userRelations = relations(userTable, ({ one, many }) => ({
  address: one(addressTable, {
    fields: [userTable.id],
    references: [addressTable.userId],
  }),
  rating: one(reviewsTable, {
    fields: [userTable.id],
    references: [reviewsTable.revieweeId],
  }),
}));

export const escrowRelations = relations(
  escrowTransactionTable,
  ({ one, many }) => ({
    paymentDetails: one(escrowPaymentTable, {
      fields: [escrowTransactionTable.id],
      references: [escrowPaymentTable.escrowId],
    }),
    escrowWalletDetails: one(escrowWalletTable, {
      fields: [escrowTransactionTable.id],
      references: [escrowWalletTable.escrowId],
    }),
    participants: many(escrowParticipantsTable),
    activityLog: many(activityLogTable),
  }),
);

export const activityLogRelations = relations(activityLogTable, ({ one }) => ({
  escrowDetails: one(escrowTransactionTable, {
    fields: [activityLogTable.entityId],
    references: [escrowTransactionTable.id],
  }),
}));

export const participantRelations = relations(
  escrowParticipantsTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [escrowParticipantsTable.userId],
      references: [userTable.id],
    }),
    transactionDetails: one(escrowTransactionTable, {
      fields: [escrowParticipantsTable.escrowId],
      references: [escrowTransactionTable.id],
    }),
    walletDetails: one(escrowWalletTable, {
      fields: [escrowParticipantsTable.escrowId],
      references: [escrowWalletTable.escrowId]
    })
  }),
);

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
