import { Effect, Layer } from "effect";
import { DatabaseConnection, DatabaseResource } from "../config/database";

/* --------  Drizzle Database Context -------- */
export const DatabaseLive = DatabaseResource.pipe(
  Effect.map((resource) => {
    return Layer.succeed(DatabaseConnection, resource.client);
  }),
  Layer.unwrapEffect,
);
