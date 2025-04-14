import { Effect } from "effect";
import { createSeed } from "./setup";
import { createAccount, getAccount } from "~/services/tigerbeetle.service";
import { TBAccountCode } from "~/layers/ledger/type";
import { AccountFlags } from "tigerbeetle-node";
import { organizationAccountId } from "~/config/environment";

export const seedOrgAccount = createSeed(
  "OrgAccountSeed",
  Effect.gen(function* (_) {
    const orgAccountId = yield* organizationAccountId;

    yield* _(
      getAccount(orgAccountId),
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
