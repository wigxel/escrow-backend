import { Effect } from "effect";
import { handleSuccessPaymentEvents } from "~/services/paystack/payment.service";

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const program = Effect.gen(function* (_) {
    yield* handleSuccessPaymentEvents(body);
  });

  return runLive(event, program);
});
