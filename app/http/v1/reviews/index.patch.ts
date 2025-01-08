import { Effect, Layer, pipe } from "effect";
import { updateReviewDto } from "~/dto/review.dto";
import { DatabaseLive } from "~/layers/database";
import { ReviewRepoLive } from "~/repositories/review.repository";
import { updateReview } from "~/services/reviews.service";

/**
 * Update a review for a product
 */
export default eventHandler(async (event) => {
  const data = await readValidatedBody(event, updateReviewDto);
  const { reviewId, ...newUpdate } = data;
  const program = updateReview(reviewId, event.context.user?.id, newUpdate);
  const result = pipe(
    program,
    Effect.map((review) => ({
      success: true,
      message: "Review updated",
      data: review,
    })),
  );

  return Effect.runPromise(Effect.scoped(Effect.provide(result, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(ReviewRepoLive),
  Layer.provideMerge(DatabaseLive),
);
