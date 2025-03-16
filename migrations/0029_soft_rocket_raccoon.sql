ALTER TABLE "account_statement" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "account_statement" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;