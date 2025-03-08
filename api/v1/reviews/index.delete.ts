import { Effect } from "effect";
import { z } from "zod";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { deleteReview } from "~/services/reviews.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(
      event,
      z.object({ reviewId: z.string().uuid() }),
    );
    const { user } = yield* getSessionInfo(event);
    return yield* deleteReview({ reviewId: data.reviewId, currentUser: user });
  });

  return runLive(event, program);
});
