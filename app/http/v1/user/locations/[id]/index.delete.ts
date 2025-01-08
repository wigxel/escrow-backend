import { Effect } from "effect";
import { locationIdValidator } from "~/dto/userLocation.dto";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { deleteLocation } from "~/services/userLocation.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const locationId = yield* validateParams(
      locationIdValidator,
      getRouterParam(event, "id"),
    );
    const { user } = yield* getSessionInfo(event);

    return yield* deleteLocation({
      currentUser: user,
      locationId: locationId,
    });
  });

  return runLive(event, program);
});
