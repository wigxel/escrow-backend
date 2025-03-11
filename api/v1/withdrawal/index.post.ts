import { Effect } from "effect";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { withdrawFromWallet } from "~/services/paystack/payment.service";
import { withdrawalRules } from "~/dto/withdrawal.dto";

export default eventHandler((event) => {
  const program = Effect.gen(function* (_) {
    const data = yield* validateBody(event, withdrawalRules);
    const { user } = yield* getSessionInfo(event);
    return yield* withdrawFromWallet({ ...data, currentUser: user });
  });

  return runLive(event, program);
});
