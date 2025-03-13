import { Effect } from "effect";
import { getNotificationsSchema } from "../../../dto/notification.dto";
import { validateQuery } from "../../../libs/request.helpers";
import { getSessionInfo } from "../../../libs/session.helpers";
import { getNotifications } from "../../../services/notification.service";
import { PaginationImpl } from "../../../services/search/pagination.service";

export default eventHandler(async (event) => {
  const searchParams = getQuery(event);

  const program = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateQuery(event, getNotificationsSchema);
    return yield* getNotifications(data.type, user.id);
  });

  return runLive(event, Effect.provide(program, PaginationImpl(searchParams)));
});
