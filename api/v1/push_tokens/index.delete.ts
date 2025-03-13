import { Effect } from "effect";
import { addPushTokenDto } from "../../../dto/push-token.dto";
import { validateBody } from "../../../libs/request.helpers";
import { getSessionInfo } from "../../../libs/session.helpers";
import { deleteUserPushToken } from "../../../services/user.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateBody(event, addPushTokenDto);

    return yield* deleteUserPushToken({ currentUser: user, token: data.token });
  });

  return runLive(event, program);
});
