import { Effect } from "effect";
import { z } from "zod";
import type { SessionUser } from "../../../../../layers/session-provider";
import { validateParams } from "../../../../../libs/request.helpers";
import { getSessionInfo } from "../../../../../libs/session.helpers";
import { getEscrowRequestDetails } from "../../../../../services/escrow/escrowTransactionServices";

export default eventHandler(async (event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    yield* validateParams(z.object({ escrowId: z.string().uuid() }), {
      escrowId,
    });

    const user: SessionUser = yield* _(
      getSessionInfo(event),
      Effect.match({
        onSuccess: (v) => v.user,
        onFailure: () => {
          return null;
        },
      }),
    );

    return yield* getEscrowRequestDetails({ currentUser: user, escrowId });
  });
  return runLive(event, program);
});
