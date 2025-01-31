CREATE TABLE IF NOT EXISTS "withdrawal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount" numeric(10, 2),
	"status" varchar,
	"reference_code" varchar,
	"tigerbeetle_transfer_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
