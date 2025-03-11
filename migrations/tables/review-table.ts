import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./escrow-transaction-table";

export const reviewsTable = pgTable("feedback_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id"),
  reviewerId: uuid("reviewer_id"),
  revieweeId: uuid("reviewee_id"),
  rating: integer("rating").default(3),
  comment: text("comment"),
  ...timestamps,
});
