import { Effect } from "effect";
import { z } from "zod";
import { validateBody, validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { releaseFunds } from "~/services/paystack/payment.service";

export default eventHandler((event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    yield* validateParams(z.object({ escrowId: z.string().uuid() }), {
      escrowId,
    });

    const body = yield* validateBody(
      event,
      z.object({
        releaseCode: z.string({ required_error: "Release code is required" }),
      }),
    );

    const session = yield* _(getSessionInfo(event));
    return yield* releaseFunds({
      escrowId,
      releaseCode: body.releaseCode,
      currentUser: session.user,
    });
  });
  return runLive(event, program);
});
