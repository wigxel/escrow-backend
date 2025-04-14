import { Effect } from "effect";
import { id } from "tigerbeetle-node";
import {
  UserFactory,
  generatePassword,
} from "~/migrations/factories/user.factory";
import { createSeed } from "~/migrations/seeds/setup";
import { UserRepo } from "~/repositories/user.repository";
import { UserWalletRepoLayer } from "~/repositories/userWallet.repo";
import { createAccount } from "~/services/tigerbeetle.service";
import { TBAccountCode } from "~/layers/ledger/type";

export const runSeed = createSeed(
  "UserSeed",
  Effect.gen(function* (_) {
    const repo = yield* UserRepo;
    const password = yield* generatePassword;
    const userWalletRepo = yield* UserWalletRepoLayer.tag;

    yield* repo.find("email", "user@gmail.com").pipe(
      Effect.catchTag("NoSuchElementException", () => {
        return UserFactory.create({
          emailVerified: true,
          email: "user@gmail.com",
          firstName: "Joseph",
          lastName: "John",
          password: password,
        });
      }),
    );

    const isGreaterThan5 = yield* _(
      repo.count(),
      Effect.map((e) => e > 5),
    );

    if (!isGreaterThan5) {
      yield* UserFactory.count(5).create({
        emailVerified: false,
      });
    }

    const users = yield* repo.all();

    for (const user of users) {
      const accountId = String(id());
      yield* userWalletRepo.create({
        userId: user.id,
        tigerbeetleAccountId: accountId,
      });
      yield* createAccount({ accountId, code: TBAccountCode.USER_WALLET });
    }
  }),
);
