import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getUnreadNotification } from "~/services/notification.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    return yield* getUnreadNotification(user.id);
  });

  return runLive(event, program);
});
