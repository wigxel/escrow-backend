import { Effect } from "effect";
import { validateBody, validateParams } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { updateEscrowTransactionStatus } from "~/services/escrow/escrowTransactionServices";
import { escrowStatusRules } from "~/dto/escrowTransactions.rules";

export default eventHandler(async (event) => {
  const escrowId = getRouterParam(event, "escrowid");
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    const data = yield* validateBody(event, escrowStatusRules);

    return yield* updateEscrowTransactionStatus({
      escrowId,
      currentUser: user,
      status: data.status,
    });
  });
  return runLive(event, program);
});
