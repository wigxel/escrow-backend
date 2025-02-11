import { Effect } from "effect";
import { reviewFilterDto } from "~/dto/review.dto";
import { validateQuery } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { getReviews } from "~/services/reviews.service";
import { PaginationImpl } from "~/services/search/pagination.service";

export default eventHandler((event) => {
  const searchParams = getQuery(event);
  const program = Effect.gen(function* (_) {
    const data = yield* validateQuery(event, reviewFilterDto);
    yield* getSessionInfo(event);
    return yield* getReviews(data);
  });

  return runLive(event, Effect.provide(program, PaginationImpl(searchParams)));
});
