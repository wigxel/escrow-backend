ALTER TABLE "activity_logs" ALTER COLUMN "entity_id" SET DATA TYPE uuid USING entity_id::uuid;
