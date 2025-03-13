import { Effect } from "effect";
import { getSessionInfo } from "../../../libs/session.helpers";
import { getUserBankAccounts } from "../../../services/bank.service";
export default eventHandler(async (event) => {
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    return yield* getUserBankAccounts(user);
  });
  return runLive(event, program);
});
