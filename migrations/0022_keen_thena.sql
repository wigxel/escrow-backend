CREATE TABLE IF NOT EXISTS "push_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid,
	"token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
