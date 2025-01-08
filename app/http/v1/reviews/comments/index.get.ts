import { Effect, Layer, pipe } from "effect";
import { head } from "effect/Array";
import { DatabaseLive } from "~/layers/database";
import { CommentRepoLive } from "~/repositories/comment.repository";
import { ReviewRepo, ReviewRepoLive } from "~/repositories/review.repository";
import { readComments, readReviews } from "~/services/reviews.service";

/**
 * Get comments of a review/comment
 */
export default eventHandler(async (event) => {
  const { reviewId, parentCommentId } = getQuery(event);
  const program = readComments({
    reviewId: reviewId?.toString(),
    parentCommentId: parentCommentId?.toString(),
  });
  const result = pipe(
    program,
    Effect.map((comments) => ({
      success: true,
      message: "Comments",
      data: comments,
    })),
  );

  return Effect.runPromise(Effect.scoped(Effect.provide(result, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(CommentRepoLive),
  Layer.provideMerge(DatabaseLive),
);
