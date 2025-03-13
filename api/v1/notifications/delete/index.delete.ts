import { Effect } from "effect";
import { getSessionInfo } from "../../../../libs/session.helpers";
import { deleteNotification } from "../../../../services/notification.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    return yield* deleteNotification(user.id, "all");
  });

  return runLive(event, program);
});
