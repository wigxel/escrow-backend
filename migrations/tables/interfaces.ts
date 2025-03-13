import { z } from "zod";
import type { otpTable } from "../../migrations/tables/otp-table";
import { memberRole, type userTable } from "../../migrations/tables/user-table";
import type { addressTable } from "./address-table";
import type {
  disputeMembersTable,
  disputeMessageTable,
  disputeReadReceiptTable,
  disputeTable,
} from "./dispute-table";
import type { notificationTable } from "./notification-table";
import type {
  escrowParticipantsTable,
  escrowPaymentTable,
  escrowRequestTable,
  escrowTransactionTable,
} from "./escrow-transaction-table";
import type { reviewsTable } from "./review-table";

const memberRoleSchema = z.enum(memberRole.enumValues);

export type User = typeof userTable.$inferSelect;
export type TUser = typeof userTable.$inferInsert;
export type Otp = typeof otpTable.$inferSelect;
export type NewOtp = typeof otpTable.$inferInsert;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type Notification = typeof notificationTable.$inferInsert;
export type TDispute = typeof disputeTable.$inferInsert;
export type TDisputeMember = typeof disputeMembersTable.$inferInsert;
export type TDisputeMessage = typeof disputeMessageTable.$inferInsert;
export type TDisputeReadReceipt = typeof disputeReadReceiptTable.$inferInsert;
export type TInsertAddress = typeof addressTable.$inferInsert;
export type TSelectAddress = typeof addressTable.$inferSelect;
export type TEscrowTransaction = typeof escrowTransactionTable.$inferInsert;
export type TEscrowPayment = typeof escrowPaymentTable.$inferInsert;
export type TEscrowParticipant = typeof escrowParticipantsTable.$inferInsert;
export type TEscrowRequest = typeof escrowRequestTable.$inferInsert;
export type TReviews = typeof reviewsTable.$inferInsert;
