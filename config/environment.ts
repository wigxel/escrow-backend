import { Config } from "effect";

export const appEnv = Config.string("APP_ENV").pipe(
  Config.map((e) => e as "local" | "production"),
);

/** a bigint string */
export const organizationAccountId = Config.string("ORG_ACCOUNT_ID").pipe(
  // remove the `n` from bigint (203n)
  Config.map((e) => e.replace("n", "")),
);
