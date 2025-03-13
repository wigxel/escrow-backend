import { faker } from "@faker-js/faker";
import { Effect } from "effect";
import {
  CommentFactory,
  ProductFactory,
  ReviewFactory,
  UserFactory,
  generatePassword,
} from "../../migrations/factories";
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
      role: faker.helpers.arrayElement(["BUYER", "SELLER"]),
    });

    // product
    const product = yield* ProductFactory.create({
      ownerId: user.id,
    });

    const writes = Array.from({ length: 15 }).map((e) => {
      return Effect.gen(function* (_) {
        // Create reviews
        const review = yield* ReviewFactory.create({
          productId: product.id,
          userId: user.id,
        });

        // Create comments on reviews
        yield* CommentFactory.create({
          reviewId: review.id,
          userId: user.id,
        });
      });
    });

    yield* Effect.all(writes, { concurrency: "unbounded" });
  }),
);
