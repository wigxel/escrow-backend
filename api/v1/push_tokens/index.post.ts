import { Effect } from "effect";
import { addPushTokenDto } from "~/dto/push-token.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { PushTokenRepoLayer } from "~/repositories/pushToken.repo";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const repo = yield* PushTokenRepoLayer.tag
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateBody(event, addPushTokenDto);

    yield* repo.create({userId:user.id,token:data.token})
  });

  return runLive(event, program)
});
