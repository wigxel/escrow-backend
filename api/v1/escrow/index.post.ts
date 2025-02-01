import { Effect } from "effect";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { createEscrowTransaction } from "~/services/escrow/escrowTransactionServices";
import { createEscrowTransactionRules } from "~/dto/escrowTransactions.rules";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* _(validateBody(event, createEscrowTransactionRules));
    const { user } = yield* getSessionInfo(event);
    return yield* createEscrowTransaction(data, user);
  });

  return runLive(event, program);
});
