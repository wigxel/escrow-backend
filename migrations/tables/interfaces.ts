import { z } from "zod";
import type { categoryTable } from "~/migrations/tables/category-table";
import type { otpTable } from "~/migrations/tables/otp-table";
import type {
  productImageTable,
  productTable,
} from "~/migrations/tables/product-table";
import type {
  commentsTable,
  reviewsTable,
} from "~/migrations/tables/reviews-table";
import { memberRole, type userTable } from "~/migrations/tables/user-table";
import type { addressTable } from "./address-table";
import type {
  disputeMembersTable,
  disputeMessageTable,
  disputeReadReceiptTable,
  disputeTable,
} from "./dispute-table";
import type { notificationTable } from "./notification-table";
import type {
  orderDetailsTable,
  orderItemsTable,
  orderShipping,
  orderStatusHistoryTable,
} from "./order-tables";
import type { paymentDetailsTable, paymentOrderTable } from "./payment-table";

const memberRoleSchema = z.enum(memberRole.enumValues);

export type Category = typeof categoryTable.$inferSelect;
export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
export type Otp = typeof otpTable.$inferSelect;
export type NewOtp = typeof otpTable.$inferInsert;
export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;
export type Comment = typeof commentsTable.$inferSelect;
export type NewComments = typeof commentsTable.$inferInsert;
export type MemberRole = z.infer<typeof memberRoleSchema>;
export type Product = typeof productTable.$inferInsert;
export type ProductImage = typeof productImageTable.$inferInsert;
export type PaymentDetail = typeof paymentDetailsTable.$inferInsert;
export type TOrderDetail = typeof orderDetailsTable.$inferInsert;
export type TOrderItem = typeof orderItemsTable.$inferInsert;
export type Notification = typeof notificationTable.$inferInsert;
export type TPaymentOrder = typeof paymentOrderTable.$inferInsert;
export type TDispute = typeof disputeTable.$inferInsert;
export type TDisputeMember = typeof disputeMembersTable.$inferInsert;
export type TDisputeMessage = typeof disputeMessageTable.$inferInsert;
export type TDisputeReadReceipt = typeof disputeReadReceiptTable.$inferInsert;
export type TInsertAddress = typeof addressTable.$inferInsert;
export type TSelectAddress = typeof addressTable.$inferSelect;
export type TOrderStatusHistory = typeof orderStatusHistoryTable.$inferSelect;
export type TDeliveryDetail = typeof orderShipping.$inferSelect;
