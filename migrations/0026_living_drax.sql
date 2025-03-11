ALTER TABLE "notification" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "feedback_reviews" ALTER COLUMN "rating" SET DEFAULT 3;