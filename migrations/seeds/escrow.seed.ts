import { Effect } from "effect";
import { createSeed } from "./setup";
import { UserRepoLayer } from "~/repositories/user.repository";
import { EscrowTransactionFactory } from "../factories/escrow.factory";

export const seedEscrow = createSeed(
  "EscrowSeed",
  Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const users = yield* userRepo.all();

    yield* Effect.all(
      users.map((user) => {
        return EscrowTransactionFactory.create({ createdBy: user.id });
      }),
    );
  }),
);
