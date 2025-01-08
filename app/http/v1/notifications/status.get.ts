import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getNotificationStatus } from "~/services/notification.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    return yield* getNotificationStatus(user.id);
  });

  return NitroApp.runPromise(event, program);
});
