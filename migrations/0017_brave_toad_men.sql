CREATE TABLE IF NOT EXISTS "referral_resource" (
	"id" "smallserial" NOT NULL,
	"name" varchar
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "has_business" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business_name" varchar;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "business-type" varchar;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_source_id" smallint;