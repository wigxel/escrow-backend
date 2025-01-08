import chalk from "chalk";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { Config, Effect } from "effect";

const conf = Config.all([Config.string("APP_ENV"), Config.string("DB_URL")]);

const [env, connectionString] = Effect.runSync(conf);

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

export default defineConfig({
  schema: "./migrations/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: env !== "production",
});
