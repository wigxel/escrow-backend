import { Effect } from "effect";
import { locationIdValidator } from "~/dto/userLocation.dto";
import { validateParams, validateZod } from "~/libs/request.helpers";
import { getLocationDetails } from "~/services/userLocation.service";

export default eventHandler((event) => {
  const locationId = getRouterParam(event, "id");

  const program = Effect.gen(function* (_) {
    const id = yield* validateParams(locationIdValidator, locationId);
    return yield* getLocationDetails(id);
  });

  return runLive(event, program);
});
