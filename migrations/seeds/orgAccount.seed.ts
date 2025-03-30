import { Config, Effect } from "effect";
import { createSeed } from "./setup";
import { createAccount, getTBAccount } from "~/services/tigerbeetle.service";
import { TBAccountCode } from "~/utils/tigerBeetle/type/type";
import { AccountFlags } from "tigerbeetle-node";

export const seedOrgAccount = createSeed(
  "OrgAccountSeed",
  Effect.gen(function* (_) {
    const orgAccountId = yield* Config.string("ORG_ACCOUNT_ID");
    yield* _(
      getTBAccount(orgAccountId),
      Effect.matchEffect({
        onFailure(e) {
          return createAccount({
            accountId: orgAccountId,
            code: TBAccountCode.COMPANY_ACCOUNT,
            flags: AccountFlags.history,
          });
        },
        onSuccess(a) {
          return Effect.succeed(1);
        },
      }),
    );
  }),
);
