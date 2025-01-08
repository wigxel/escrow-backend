import { Console, Effect } from "effect";
import { UserFactory, generatePassword } from "~/migrations/factories";
import { createSeed } from "~/migrations/seeds/setup";
import { UserRepo } from "~/repositories/user.repository";

export const runSeed = createSeed(
  "UserSeed",
  Effect.gen(function* (_) {
    const repo = yield* UserRepo;
    const password = yield* generatePassword;

    yield* repo.find("email", "joseph.owonwo@gmail.com").pipe(
      Effect.catchTag("NoSuchElementException", () => {
        return UserFactory.create({
          emailVerified: true,
          email: "joseph.owonwo@gmail.com",
          firstName: "Joseph",
          lastName: "John",
          password: password,
        });
      }),
    );

    const isGreaterThan12 = yield* _(
      repo.count(),
      Effect.map((e) => e > 12),
    );

    if (!isGreaterThan12) {
      yield* UserFactory.count(12).create({
        emailVerified: false,
      });
    }
  }),
);
