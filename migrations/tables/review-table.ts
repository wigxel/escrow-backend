import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./escrow-transaction-table";
import { userTable } from "./user-table";

export const reviewsTable = pgTable("feedback_reviews", {
	id: uuid("id").primaryKey().defaultRandom(),
	escrowId: uuid("escrow_id"),
	reviewerId: uuid("reviewer_id"),
	revieweeId: uuid("reviewee_id"),
	rating: integer("rating"),
	...timestamps,
});

export const commentsTable = pgTable("comments", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("userId")
		.notNull()
		.references(() => userTable.id),
	reviewId: uuid("reviewId")
		.notNull()
		.references(() => reviewsTable.id, { onDelete: "cascade" }),
    comment: text("content").notNull(),
	...timestamps,
});
