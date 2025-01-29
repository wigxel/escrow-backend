import { Effect } from "effect";
import { z } from "zod";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { releaseFunds } from "~/services/payment.service";

export default eventHandler((event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    yield* validateParams(z.object({ escrowId: z.string().uuid() }), {
      escrowId,
    });

    const session = yield* _(getSessionInfo(event));
    return yield* releaseFunds({ escrowId, currentUser: session.user });
  });
  return runLive(event, program);
});
