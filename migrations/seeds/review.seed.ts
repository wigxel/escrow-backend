import { Effect } from "effect";
import { createSeed } from "../../migrations/seeds/setup";
import { CommentFactory, ReviewFactory } from "../factories/review.factory";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { UserRepoLayer } from "~/repositories/user.repository";

export const seedReview = createSeed(
  "ReviewSeed",
  Effect.gen(function* () {
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const userRepo = yield* UserRepoLayer.Tag;

    const users = yield* userRepo.all();
    const escrows = yield* escrowRepo.all();

    const writes = escrows.map((escrow) => {
      const reviewer = users.filter((v) => v.id !== escrow.createdBy)[0];

      return Effect.gen(function* (_) {
        // Create reviews
        const review = yield* ReviewFactory.create({
          escrowId: escrow.id,
          reviewerId: reviewer.id,
          revieweeId: escrow.createdBy,
        });

        // Create comments on reviews
        yield* CommentFactory.create({
          reviewId: review.id,
          userId: reviewer.id,
        });
      });
    });

    yield* Effect.all(writes, { concurrency: "unbounded" });
  }),
);
