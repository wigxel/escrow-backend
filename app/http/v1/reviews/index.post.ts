import { Effect, pipe } from "effect";
import { createReviewDto } from "~/dto/review.dto";
import { createReview } from "~/services/reviews.service";

/**
 * Create a review floor a product
 */
export default eventHandler(async (event) => {
  const data = await readValidatedBody(event, createReviewDto);

  const program = createReview({
    productId: data.productId,
    comment: data.comment,
    rating: data.rating,
    images: data.images,
    userId: event.context.user?.id,
  });

  const result = pipe(
    program,
    Effect.map((review) => ({
      success: true,
      message: "Reviews",
      data: review,
    })),
  );

  return runLive(event, result);
});
