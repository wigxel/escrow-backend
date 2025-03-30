import { Effect } from "effect";
import { createSeed } from "./setup";
import { UserRepoLayer } from "~/repositories/user.repository";
import { AddressFactory } from "../factories/address.factory";

export const seedAddress = createSeed(
  "AddressSeed",
  Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const users = yield* userRepo.all();

    yield* Effect.all(
      users.map((user) => {
        return AddressFactory.create({ userId: user.id });
      }),
    );
  }),
);
