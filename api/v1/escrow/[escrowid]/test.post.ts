import { validateBody } from "~/libs/request.helpers";
import { handleSuccessPaymentEvents } from "~/services/paystack/payment.service";
import { Effect } from "effect";
import { paymentMetaSchema } from "~/dto/escrowTransactions.dto";
import { appEnv } from "~/config/environment";
import { UnknownException } from "effect/Cause";

export default defineAppHandler((event) => {
  return Effect.gen(function* () {
    const app_env = yield* appEnv;

    if (app_env !== "local") {
      yield* new UnknownException("Endpoint is for product alone");
    }

    const payload = yield* validateBody(event, paymentMetaSchema);
    yield* handleSuccessPaymentEvents(payload);

    return {
      status: "success",
      message: "Fake transaction completed",
    };
  });
});
