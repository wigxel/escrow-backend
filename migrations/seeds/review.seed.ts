import { faker } from "@faker-js/faker";
import { Effect } from "effect";
import { UserFactory, generatePassword } from "../factories/user.factory";
import { createSeed } from "../../migrations/seeds/setup";

export const runSeed = createSeed(
  "ReviewSeed",
  Effect.gen(function* () {
    // Create user to make actions with
    const password = yield* generatePassword;
    const user = yield* UserFactory.create({
      emailVerified: true,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: password,
      phone: faker.phone.number(),
      createdAt: faker.date.past(),
      role: "user", // Changed from "BUYER"/"SELLER" to "user"/"admin" to match the factory type
    });

    // This seed function now just creates a user
    // The product, review, and comment creation has been removed
    // as the factories for these are missing
    console.log("Created user:", user.email);
  }),
);
