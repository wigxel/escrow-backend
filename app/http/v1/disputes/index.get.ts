import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getDisputesByUserId } from "~/services/dispute.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);

    return yield* getDisputesByUserId(user.id);
  });

  return runLive(event, program);
});
