import { Effect } from "effect";
import { addPushTokenDto } from "~/dto/push-token.dto";
import { validateBody } from "~/libs/request.helpers";
import { dataResponse } from "~/libs/response";
import { getSessionInfo } from "~/libs/session.helpers";
import { getUserPushTokens } from "~/services/user.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    yield* validateBody(event, addPushTokenDto);
    return yield* getUserPushTokens(user.id);
  });

  return runLive(event, program);
});
