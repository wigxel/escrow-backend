import { Effect, Layer, pipe } from "effect";
import { deleteCommentDto } from "~/dto/comment.dto";
import { DatabaseLive } from "~/layers/database";
import { CommentRepoLive } from "~/repositories/comment.repository";
import { deleteComment } from "~/services/reviews.service";

/**
 * Delete a comment of a review/comment
 */
export default eventHandler(async (event) => {
  const data = await readValidatedBody(event, deleteCommentDto);
  const { commentId } = data;
  const program = deleteComment(commentId, event.context.user?.id);
  const result = pipe(
    program,
    Effect.map((comment) => ({
      success: true,
      message: "Comment deleted",
      data: comment,
    })),
  );

  return Effect.runPromise(Effect.scoped(Effect.provide(result, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(CommentRepoLive),
  Layer.provideMerge(DatabaseLive),
);
