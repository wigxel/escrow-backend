import { Effect } from "effect";
import { notificationIdSchema } from "../../../../../dto/notification.dto";
import { validateBody } from "../../../../../libs/request.helpers";
import { getSessionInfo } from "../../../../../libs/session.helpers";
import { deleteNotification } from "../../../../../services/notification.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateBody(event, notificationIdSchema);
    return yield* deleteNotification(user.id, "list", data);
  });

  return runLive(event, program);
});
