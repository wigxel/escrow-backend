CREATE TABLE IF NOT EXISTS "bank_account_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_number" varchar NOT NULL,
	"account_name" varchar,
	"bank_name" varchar NOT NULL,
	"bank_code" varchar,
	"verificationToken" uuid,
	"expires_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verification_token_index" ON "bank_account_verification" USING btree ("verificationToken");