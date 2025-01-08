import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import chalk from "chalk";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { Config, Effect } from "effect";

const conf = Effect.gen(function* () {
  const dbURL = yield* Config.string("DB_URL");
  return dbURL;
});
const connectionString = Effect.runSync(conf);

if (!connectionString) {
  console.log("\n\n");
  console.log(
    `${chalk.red("→ DB connection required")}\n${chalk.white(
      `Ensure ${chalk.blueBright("`DB_URL`")} is present in environment file`,
    )}`,
  );
  console.log("\n");
  process.exit(0);
}

// for migrations
const migrationClient = postgres(connectionString, { max: 1 });

async function main() {
  // run migratoin
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./migrations",
  });
  // close connection
  await migrationClient.end();
}

main();
