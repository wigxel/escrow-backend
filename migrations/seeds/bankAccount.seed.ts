import { Effect } from "effect";
import { createSeed } from "./setup";
import { UserRepoLayer } from "~/repositories/user.repository";
import { BankAccountFactory } from "../factories/bankAccount.factory";
import { createAccount } from "~/services/tigerbeetle.service";
import { id } from "tigerbeetle-node";
import { TBAccountCode } from "~/layers/ledger/type";

export const seedBankAccount = createSeed(
  "BankAccountSeed",
  Effect.gen(function* () {
    const userRepo = yield* UserRepoLayer.Tag;
    const users = yield* userRepo.all();

    for (const user of users) {
      const acctId = id();

      yield* Effect.all([
        BankAccountFactory.create({ userId: user.id }),
        createAccount({
          accountId: String(acctId),
          code: TBAccountCode.BANK_ACCOUNT,
        }),
      ]);
    }
  }),
);
