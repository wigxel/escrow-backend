import { Effect } from "effect";
import { UserRepo } from "~/repositories/user.repository";
import { addressFactory } from "../factories";
import { createSeed } from "./setup";

export const runSeed = createSeed(
  "AddressSeed",
  Effect.gen(function* () {
    const userRepo = yield* UserRepo;

    const user = yield* userRepo.find({ email: "joseph.owonwo@gmail.com" });

    yield* addressFactory.count(5).create({
      userId: user.id,
    });
  }),
);
