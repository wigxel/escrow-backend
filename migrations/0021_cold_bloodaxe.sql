CREATE TABLE IF NOT EXISTS "dispute_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dispute_resolutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar
);
