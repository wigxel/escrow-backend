import { Effect } from "effect";
import { UnknownException } from "effect/Cause";
import { CheckoutManager } from "~/layers/payment/checkout-manager";
import { PaymentEvent, PaymentEventService } from "~/layers/payment/payment-events";
import { updateEscrowStatus } from "./transaction/escrowTransactionServices";

export const handlePaymentEvents = (res: Record<string,unknown>, paystackSignature: string) => {
  return Effect.gen(function* (_) {
    const manager = yield* CheckoutManager;
    const paymentEvents = yield* PaymentEventService;

    const isVerifiedWebhook = yield* manager.verifyWebhook(
      res,
      paystackSignature,
    );
    if (!isVerifiedWebhook) {
      yield* new UnknownException(
      "Signature mismatch: Invalid signature.",
      );
    }
    const event = paymentEvents.resolve(res)

    const metadata = yield* paymentEvents.getMetadata<Record<string,unknown>>(event);

    if (PaymentEvent.$is("Chargefailed")(event)) {
      // do something when the payment fails
      yield* Effect.logDebug("Failed payment event");
    }

    if (!PaymentEvent.$is("ChargeSuccess")(event)) {
      yield* Effect.logDebug("Ignoring payment event");
      return;
    }

    yield* Effect.logDebug(`Payment successful for (${res?.reference})`);

  });
};