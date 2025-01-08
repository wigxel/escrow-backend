import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { Config, Context, Effect } from "effect";
import { TaggedError } from "effect/Data";
import postgres from "postgres";
import * as schema from "../migrations/schema";

export type DrizzlePgDatabase = PostgresJsDatabase<typeof schema>;

export class DatabaseConnection extends Context.Tag("DatabaseConnection")<
  DatabaseConnection,
  DrizzlePgDatabase
>() {}

// --- Resource ---
export interface DatabaseResourceInterface {
  readonly client: DrizzlePgDatabase;
  readonly handler: ReturnType<typeof postgres>;
  readonly close: () => Promise<void>;
}

export class DatabaseResourceError extends TaggedError("DatabaseResource") {
  constructor(public error: unknown) {
    super();
  }

  toString() {
    return `DatabaseResourceError: ${this.error.toString()}`;
  }
}

export const acquire = Effect.gen(function* (_) {
  const DB_URL = yield* Config.string("DB_URL");

  const sql = postgres(DB_URL);
  yield* Effect.logDebug("[Database] connected established ✅");

  const drizzle_client = drizzle(sql, {
    schema,
  });

  return {
    client: drizzle_client,
    handler: sql,
    async close() {
      await sql.end({ timeout: 1 });
    },
  } satisfies DatabaseResourceInterface;
}).pipe(
  Effect.mapError((error) => {
    if (error._tag === "ConfigError") return error;
    return new DatabaseResourceError(error);
  }),
);

export const release = (res: DatabaseResourceInterface) => {
  return Effect.promise(() => res.close()).pipe(
    Effect.tap(Effect.logDebug("[Database] connection closed 🚫")),
  );
};

export const DatabaseResource = Effect.acquireRelease(acquire, release);
