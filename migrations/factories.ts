import { Effect } from "effect";
import { toLower } from "ramda";
import { hashPassword } from "~/layers/encryption/helpers";
import type {
  userTable,
} from "~/migrations/schema";
import { createFactory } from "~/migrations/seeds/setup";
import { UserRepo } from "~/repositories/user.repository";

export const generatePassword = hashPassword("123456");

export const UserFactory = createFactory(UserRepo, ($faker) => {
  return Effect.gen(function* (_) {
    const password = yield* generatePassword;

    return {
      firstName: $faker.person.firstName(),
      lastName: $faker.person.lastName(),
      email: toLower($faker.internet.email()),
      emailVerified: $faker.helpers.arrayElement([true, false]),
      password: password,
      phone: $faker.phone.number(),
      createdAt: $faker.date.past(),
      role: $faker.helpers.arrayElement(["user", "admin"]),
    } satisfies typeof userTable.$inferInsert;
  });
});
