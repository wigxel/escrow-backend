import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { productTable } from "~/migrations/tables/product-table";
import { userTable } from "~/migrations/tables/user-table";

export const reviewsTable = pgTable("feedback_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  comment: text("comment"),
  rating: integer("rating"),
  userId: uuid("userId")
    .notNull()
    .references(() => userTable.id),
  productId: uuid("productId")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table (for comments on reviews)
export const commentsTable = pgTable("feedback_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  comment: text("content").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => userTable.id),
  reviewId: uuid("reviewId")
    .notNull()
    .references(() => reviewsTable.id, { onDelete: "cascade" }),
  parentCommentId: uuid("parent_comment_id"),
  // .references(
  //   () => commentsTable.id,
  //   { onDelete: "cascade" },
  // )
  createdAt: timestamp("created_at").defaultNow(),
});
