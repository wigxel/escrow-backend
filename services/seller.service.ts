import { Effect } from "effect";

import { ReviewRepo } from "~/repositories/review.repository";

export function getReviews(sellerId: string) {
  return Effect.gen(function* () {
    const reviewRepo = yield* ReviewRepo;

    return yield* reviewRepo.sellersReviewPaginated({
      sellerId,
    });
  });
}
