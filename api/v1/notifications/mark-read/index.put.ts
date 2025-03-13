import { Effect } from "effect";
import { getSessionInfo } from "../../../../libs/session.helpers";
import { markAsRead } from "../../../../services/notification.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    return yield* markAsRead(user.id, "all");
  });

  return runLive(event, program);
});
