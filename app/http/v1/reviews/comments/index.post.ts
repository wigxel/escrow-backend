import { Effect, pipe } from "effect";
import { createCommentDto } from "~/dto/comment.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { CommentRepoLive } from "~/repositories/comment.repository";
import { createComment } from "~/services/reviews.service";

/**
 * Create a comment for a product review/comment
 */
export default eventHandler(async (event) => {
  const create = Effect.gen(function* () {
    const session = yield* getSessionInfo(event);
    const body = yield* validateBody(event, createCommentDto);

    return yield* createComment({
      userId: session.user.id,
      createdAt: new Date(),
      comment: body.comment,
      reviewId: body.reviewId,
      parentCommentId: body.parentCommentId,
    });
  });

  const result = pipe(
    create,
    Effect.map((comment) => ({
      success: true,
      message: "Comment added",
      data: comment,
    })),
    Effect.provide(CommentRepoLive),
  );

  return runLive(event, result);
});
