import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { PaginationImpl } from "~/services/search/pagination.service";
import { getUserLocations } from "~/services/userLocation.service";

export default eventHandler((event) => {
  const searchParams = getQuery(event);
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);

    return yield* getUserLocations({ userId: user.id });
  });

  return runLive(event, Effect.provide(program, PaginationImpl(searchParams)));
});
