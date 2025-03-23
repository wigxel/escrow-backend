import { Effect } from "effect";
import { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";
import { validateBody, validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { initializeEscrowDeposit } from "~/services/escrow/escrowTransactionServices";
import { confirmEscrowRequestRules } from "~/dto/escrowTransactions.dto";
import { uuidValidator } from "~/dto/user.dto";

const schema = z.object({
  escrowId: uuidValidator('Escrow ID')
});

export default eventHandler((event) => {
  const escrowId = getRouterParam(event, "escrowid");

  const program = Effect.gen(function* (_) {
    yield* validateParams(schema, { escrowId });

    const user: SessionUser = yield* _(
      getSessionInfo(event),
      Effect.match({
        onSuccess: (v) => v.user,
        onFailure: () => null
      }),
    );

    // validate payload if the user isn't authenticated
    const data = user ? {} : yield* validateBody(event, confirmEscrowRequestRules)

    return yield* initializeEscrowDeposit({ ...data, escrowId }, user);
  });
  return runLive(event, program);
});
