import { Effect } from "effect";
import { z } from "zod";
import { validateQuery } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { checkUsername } from "~/services/user.service";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateQuery(
      event,
      z.object({ username: z.string().min(3) }),
    );
    yield* getSessionInfo(event);
    return yield* checkUsername(data.username);
  });

  return runLive(event, program);
});
