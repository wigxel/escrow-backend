import { Effect } from "effect";
import { createReviewDto } from "../../../dto/review.dto";
import { validateBody } from "../../../libs/request.helpers";
import { getSessionInfo } from "../../../libs/session.helpers";
import { createReview } from "../../../services/reviews.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(event, createReviewDto);
    const { user } = yield* getSessionInfo(event);
    return yield* createReview(
      {
        escrowId: data.escrowId,
        comment: data.comment,
        rating: data.rating,
      },
      user,
    );
  });

  return runLive(event, program);
});
