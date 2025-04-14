import { type PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import { Config, Context, Effect } from "effect";
import { TaggedError } from "effect/Data";
import postgres from "postgres";
import * as schema from "../migrations/schema";
import { TigerBeetleAdapter } from "~/layers/ledger/tigerbeetle";

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

const acquire = Effect.gen(function* (_) {
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

export const DatabaseResource = Effect.succeed(Effect.runSync(acquire));

const connectToTB = Effect.gen(function* () {
  const addr = yield* Config.string("TB_ADDRESS");

  yield* Effect.logInfo("Connecting to Tigerbeetle Server", addr);
  const instance = TigerBeetleAdapter.getInstance(addr);

  const is_connected = yield* Effect.promise(() => instance.isConnected());

  if (!is_connected) {
    yield* Effect.fail(new Error("Tigerbeetle Server unreachable"));
  }

  yield* Effect.logInfo("✅ Tigerbeetle connected");

  return instance;
});

export const TigerBeetleResource = Effect.runPromise(
  connectToTB.pipe(Effect.retry({ times: 3 })),
);
