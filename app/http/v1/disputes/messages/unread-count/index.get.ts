import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getUnreadMessage } from "~/services/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);

    return yield* getUnreadMessage({
      currentUser: user,
    });
  });

  return runLive(event, program);
});
