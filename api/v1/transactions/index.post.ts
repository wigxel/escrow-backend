import { Effect } from "effect";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { createTransaction } from "~/services/transaction/transactionServices";
import { createTransactionRules } from "~/validationRules/transactions.rules";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* _(validateBody(event, createTransactionRules));
    const { user } = yield* getSessionInfo(event);
    return yield* createTransaction(data, user);
  });

  return runLive(event, program);
});
