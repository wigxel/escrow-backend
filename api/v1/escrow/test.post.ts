import { Effect } from "effect";
import { id } from "tigerbeetle-node";
import { createTransfer } from "~/services/tigerbeetle.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* (_) {
    yield* createTransfer({
      transferId: String(id()),
      amount: 5000,
      credit_account_id: "1",
      debit_account_id: "2",
    });
  });

  return runLive(event, program);
});
