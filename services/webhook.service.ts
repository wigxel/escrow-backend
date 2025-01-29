import { Effect } from "effect";
import { ExpectedError } from "~/config/exceptions";
import {
  PaymentGatewayEvent,
  PaymentGatewayEventService,
} from "~/layers/payment/payment-events";
import { PaymentGateway } from "~/layers/payment/payment-gateway";
import type {
  TPaystackPaymentEventResponse,
  TSuccessPaymentMetaData,
} from "~/types/types";
import { handleSuccessPaymentEvents } from "./paystack/payment.service";


export const handlePaystackWebhook = (
  res: TPaystackPaymentEventResponse,
  paystackSignature: string,
) => {
  return Effect.gen(function* (_) {
    const paymentGateway = yield* PaymentGateway;
    const paystackEvents = yield* PaymentGatewayEventService;

    const isVerifiedWebhook = yield* paymentGateway.verifyWebhook(
      res,
      paystackSignature,
    );
    if (!isVerifiedWebhook) {
      yield* new ExpectedError("Signature mismatch: Invalid signature.");
    }

    const event = paystackEvents.resolve(res);

    if (PaymentGatewayEvent.$is("Chargefailed")(event)) {
      // do something when the payment fails
      yield* Effect.logDebug("Failed payment event");
    }

    if (PaymentGatewayEvent.$is("ChargeSuccess")(event)) {
      yield* Effect.logDebug(`Payment successful for (${res?.data.reference})`);
      const metadata =
        yield* paystackEvents.getMetadata<TSuccessPaymentMetaData>(event);
      yield* handleSuccessPaymentEvents(res, metadata);
      return;
    }
  });
};
