import { Effect } from "effect";
import { UnknownException } from "effect/Cause";
import { CheckoutManager } from "~/layers/payment/checkout-manager";
import {
  PaymentEvent,
  PaymentEventService,
} from "~/layers/payment/payment-events";
import { updateEscrowStatus } from "./escrowTransactionServices";

export const handlePaymentEvents = (
  res: {
    event: string;
    data: {
      amount: string;
      reference: string;
      status: string;
      channel: string;
      metadata: TSuccessPaymentMetaData;
    };
  },
  paystackSignature: string,
) => {
  return Effect.gen(function* (_) {
    const manager = yield* CheckoutManager;
    const paymentEvents = yield* PaymentEventService;

    const isVerifiedWebhook = yield* manager.verifyWebhook(
      res,
      paystackSignature,
    );
    if (!isVerifiedWebhook) {
      yield* new UnknownException("Signature mismatch: Invalid signature.");
    }
    const event = paymentEvents.resolve(res);

    const metadata =
      yield* paymentEvents.getMetadata<TSuccessPaymentMetaData>(event);

    if (PaymentEvent.$is("Chargefailed")(event)) {
      // do something when the payment fails
      yield* Effect.logDebug("Failed payment event");
    }

    if (!PaymentEvent.$is("ChargeSuccess")(event)) {
      yield* Effect.logDebug("Payment failed: Ignoring payment event");
      return;
    }

    yield* Effect.logDebug(`Payment successful for (${res?.data.reference})`);

    yield* updateEscrowStatus({
      escrowId: metadata.escrowId,
      customerDetails: metadata.customerDetails,
      paymentDetails: {
        amount: Number(res.data.amount),
        status: res.data.status,
        paymentMethod: res.data.channel,
      },
    });

    //TODO: in-app notification or email for successful payment
  });
};

export type TSuccessPaymentMetaData = {
  escrowId: string;
  customerDetails: {
    userId: string;
    email: string;
    username: string;
    role: "buyer" | "seller";
  };
};

export type TPaymentDetails = {
  amount: number;
  status: string;
  paymentMethod: string;
};
