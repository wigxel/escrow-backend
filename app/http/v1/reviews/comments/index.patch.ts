import { Effect, Layer, pipe } from "effect";
import { updateCommentDto } from "~/dto/comment.dto";
import { DatabaseLive } from "~/layers/database";
import { CommentRepoLive } from "~/repositories/comment.repository";
import { updateComment } from "~/services/reviews.service";

/**
 * Update a comment of a review/comment
 */
export default eventHandler(async (event) => {
  const data = await readValidatedBody(event, updateCommentDto);
  const { commentId, comment } = data;
  const program = updateComment(commentId, event.context.user?.id, { comment });
  const result = pipe(
    program,
    Effect.map((comment) => ({
      success: true,
      message: "Comment updated",
      data: comment[0],
    })),
  );

  return Effect.runPromise(Effect.scoped(Effect.provide(result, Dependencies)));
});

const Dependencies = Layer.empty.pipe(
  Layer.provideMerge(CommentRepoLive),
  Layer.provideMerge(DatabaseLive),
);
