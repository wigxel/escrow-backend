import { Layer, Match, Option, pipe } from "effect";
import {
  PaymentEvent,
  PaymentEventService,
  type PaymentEvents,
} from "~/layers/payment/payment-events";

export const StripeEvent = PaymentEventService.of({
  resolve(event: object) {
    return pipe(
      Match.value(event),
      Match.when(
        { type: "payment_intent.succeeded" },
        PaymentEvent.PaymentSuccess,
      ),
      Match.when(
        { type: "payment_intent.created" },
        PaymentEvent.PaymentInitiated,
      ),
      Match.when(
        { type: "payment_intent.payment_failed" },
        PaymentEvent.PaymentFailure,
      ),
      Match.orElse((data) => PaymentEvent.UnknownPaymentEvent({ data })),
    );
  },

  getMetadata(event: PaymentEvents) {
    return pipe(
      event,
      PaymentEvent.$match({
        /* @ts-expect-error*/
        PaymentSuccess: (x) => x.data?.object?.metadata,
        // @ts-expect-error
        PaymentInitiated: (x) => x.data?.object?.metadata,
        // @ts-expect-error
        PaymentFailure: (x) => x.data?.object?.metadata,
        UnknownPaymentEvent: () => null,
      }),
      Option.fromNullable,
    );
  },
});

export const StripeEventLive = Layer.succeed(PaymentEventService, StripeEvent);
