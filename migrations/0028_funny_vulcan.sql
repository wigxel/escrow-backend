ALTER TABLE "user" ADD COLUMN "google_id" varchar;--> statement-breakpoint
ALTER TABLE "escrow_request" ADD COLUMN "processed_at" timestamp (6) with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expires_processed_at_Idx" ON "escrow_request" USING btree ("expires_at","processed_at");