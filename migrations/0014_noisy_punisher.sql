CREATE TABLE IF NOT EXISTS "feedback_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_id" uuid,
	"reviewer_id" uuid,
	"reviewee_id" uuid,
	"rating" integer,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
