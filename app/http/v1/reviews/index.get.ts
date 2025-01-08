import { Effect, Layer, pipe } from "effect";
import { DatabaseLive } from "~/layers/database";
import { ReviewRepoLive } from "~/repositories/review.repository";
import { readReviews } from "~/services/reviews.service";

/**
 * Get reviews for a product with their comments
 */
export default eventHandler(async (event) => {
  const { productID } = getQuery(event);
  const reviews = readReviews({
    ...(productID && { productId: productID.toString() }),
  });
  const result = pipe(
    reviews,
    Effect.map((reviews) => ({
      success: true,
      message: "Reviews",
      data: reviews,
    })),
  );

  return Effect.runPromise(Effect.scoped(Effect.provide(result, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(ReviewRepoLive),
  Layer.provideMerge(DatabaseLive),
);
