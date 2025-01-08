import { Effect, Layer, pipe } from "effect";
import { deleteReviewDto } from "~/dto/review.dto";
import { DatabaseLive } from "~/layers/database";
import { ReviewRepoLive } from "~/repositories/review.repository";
import { deleteReview } from "~/services/reviews.service";

/**
 * Delete a review for a product
 */
export default eventHandler(async (event) => {
  const data = await readValidatedBody(event, deleteReviewDto);
  const { reviewId } = data;
  const program = deleteReview(reviewId, event.context.user?.id);
  const result = pipe(
    program,
    Effect.map((review) => ({
      success: true,
      message: "Review deleted",
      data: review,
    })),
  );

  return Effect.runPromise(Effect.scoped(Effect.provide(result, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(ReviewRepoLive),
  Layer.provideMerge(DatabaseLive),
);
