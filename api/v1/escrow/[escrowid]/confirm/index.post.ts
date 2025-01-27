import { Effect } from "effect";
import { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";
import { validateBody, validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { initializeEscrowDeposit } from "~/services/escrowTransactionServices";
import { confirmEscrowRequestRules } from "~/validationRules/escrowTransactions.rules";

export default eventHandler((event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    yield* validateParams(z.object({ escrowId: z.string().uuid() }), {
      escrowId,
    });

    const data = yield* validateBody(event, confirmEscrowRequestRules);

    const user: SessionUser = yield* _(
      getSessionInfo(event),
      Effect.match({
        onSuccess: (v) => v.user,
        onFailure: () => {
          return null;
        },
      }),
    );

    return yield* initializeEscrowDeposit({ ...data, escrowId }, user);
  });
  return runLive(event, program);
});
