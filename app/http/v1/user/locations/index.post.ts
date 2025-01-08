import { Effect } from "effect";
import { addNewLocationSchema } from "~/dto/userLocation.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { addNewLocation } from "~/services/userLocation.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateBody(event, addNewLocationSchema);

    return yield* addNewLocation({
      user,
      // @ts-expect-error
      location: {
        ...data,
        latitude: String(data.latitude),
        longitude: String(data.longitude),
      },
    });
  });

  return runLive(event, program);
});
