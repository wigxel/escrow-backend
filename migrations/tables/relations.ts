import { relations } from "drizzle-orm";
import { cartItemsTable, cartTable } from "~/migrations/tables/cart-table";
import { categoryTable } from "~/migrations/tables/category-table";
import {
  disputeMembersTable,
  disputeTable,
} from "~/migrations/tables/dispute-table";
import {
  productImageTable,
  productTable,
} from "~/migrations/tables/product-table";
import { commentsTable, reviewsTable } from "~/migrations/tables/reviews-table";
import { userTable } from "~/migrations/tables/user-table";
import { addressTable } from "./address-table";
import {
  orderDetailsTable,
  orderItemsTable,
  orderShipping,
  orderStatusHistoryTable,
} from "./order-tables";
import { paymentDetailsTable } from "./payment-table";

export const userRelations = relations(userTable, ({ many }) => ({
  reviews: many(reviewsTable),
  comments: many(commentsTable),
  products: many(productTable),
}));

export const reviewRelations = relations(reviewsTable, ({ one, many }) => ({
  product: one(productTable, {
    fields: [reviewsTable.productId],
    references: [productTable.id],
  }),
  user: one(userTable, {
    fields: [reviewsTable.userId],
    references: [userTable.id],
  }),
  comments: many(commentsTable),
}));

export const commentRelations = relations(commentsTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [commentsTable.userId],
    references: [userTable.id],
  }),
  review: one(reviewsTable, {
    fields: [commentsTable.reviewId],
    references: [reviewsTable.id],
  }),
  parentComment: one(commentsTable, {
    fields: [commentsTable.parentCommentId],
    references: [commentsTable.id],
  }),
  childComments: many(commentsTable, {
    relationName: "childComments",
  }),
}));

export const productRelations = relations(productTable, ({ one, many }) => ({
  ownerDetails: one(userTable, {
    fields: [productTable.ownerId],
    references: [userTable.id],
  }),
  productLocation: one(addressTable, {
    fields: [productTable.locationId],
    references: [addressTable.id],
  }),
  productImages: many(productImageTable),
  category: one(categoryTable, {
    fields: [productTable.categoryId],
    references: [categoryTable.id],
  }),
  reviews: many(reviewsTable),
}));

export const productImageRelations = relations(
  productImageTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productImageTable.productId],
      references: [productTable.id],
    }),
  }),
);

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  products: many(productTable),
}));

export const cartRelations = relations(cartTable, ({ many }) => ({
  items: many(cartItemsTable),
}));

export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  cart: one(cartTable, {
    fields: [cartItemsTable.cartId],
    references: [cartTable.cartId],
  }),
  productDetails: one(productTable, {
    fields: [cartItemsTable.productId],
    references: [productTable.id],
  }),
  productImage: one(productImageTable, {
    fields: [cartItemsTable.productId],
    references: [productImageTable.productId],
  }),
}));

export const orderRelations = relations(orderDetailsTable, ({ one, many }) => ({
  paymentDetails: one(paymentDetailsTable, {
    fields: [orderDetailsTable.paymentId],
    references: [paymentDetailsTable.paymentId],
  }),
  buyer: one(userTable, {
    fields: [orderDetailsTable.buyerId],
    references: [userTable.id],
  }),
  shipping: one(orderShipping, {
    fields: [orderDetailsTable.id],
    references: [orderShipping.orderId],
  }),
  orderItems: many(orderItemsTable),
  history: many(orderStatusHistoryTable),
}));

export const orderHistoryRelations = relations(
  orderStatusHistoryTable,
  ({ one }) => ({
    order: one(orderDetailsTable, {
      fields: [orderStatusHistoryTable.orderId],
      references: [orderDetailsTable.id],
    }),
  }),
);

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  orderDetails: one(orderDetailsTable, {
    fields: [orderItemsTable.orderId],
    references: [orderDetailsTable.id],
  }),
  productDetails: one(productTable, {
    fields: [orderItemsTable.productId],
    references: [productTable.id],
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
