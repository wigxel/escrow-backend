ALTER TABLE "account_statement" ALTER COLUMN "metadata" TYPE jsonb USING "metadata"::jsonb;--> statement-breakpoint
ALTER TABLE "account_statement" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;
