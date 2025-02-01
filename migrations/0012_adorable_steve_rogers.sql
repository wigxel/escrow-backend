DO $$ BEGIN
 CREATE TYPE "public"."account_statement_status" AS ENUM('pending', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "bank_account" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "account_statement" ADD COLUMN "status" "account_statement_status" DEFAULT 'completed';