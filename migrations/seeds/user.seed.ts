import { Console, Effect } from "effect";
import {
  UserFactory,
  generatePassword,
} from "~/migrations/factories/user.factory";
import { createSeed } from "~/migrations/seeds/setup";
import { UserRepo } from "~/repositories/user.repository";
import { createAccount } from "~/services/tigerbeetle.service";

export const runSeed = createSeed(
  "UserSeed",
  Effect.gen(function* (_) {
    const repo = yield* UserRepo;
    const password = yield* generatePassword;

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
  }),
);
