import { Effect } from "effect";
import { z } from "zod";
import { validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { releaseFundsInfo } from "~/services/escrow/escrowTransactionServices";

export default eventHandler((event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    yield* validateParams(z.object({ escrowId: z.string().uuid() }), {
      escrowId,
    });
    return yield* releaseFundsInfo(escrowId);
  });
  return runLive(event, program);
});
