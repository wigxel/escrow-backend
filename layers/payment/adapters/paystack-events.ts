import { Layer, Match, Option, pipe } from "effect";
import {
  PaymentEvent,
  PaymentEventService,
  type PaymentEvents,
} from "~/layers/payment/payment-events";

export const PaystackEvent = PaymentEventService.of({
  resolve(ev: object) {
    return pipe(
      Match.value(ev),
      Match.when({ event: "charge.success" }, PaymentEvent.ChargeSuccess),
      Match.when({ event: "charge.failed" }, PaymentEvent.Chargefailed),
      Match.orElse((data) => PaymentEvent.UnknownPaymentEvent({ data })),
    );
  },

  getMetadata(event: PaymentEvents) {
    return pipe(
      event,
      PaymentEvent.$match({
        /* @ts-expect-error*/
        ChargeSuccess: (x) => x.data?.metadata,
        /* @ts-expect-error*/
        Chargefailed: (x) => x.data?.metadata,
        UnknownPaymentEvent: () => null,
      }),
      Option.fromNullable,
    );
  },
});

export const PaystackEventLive = Layer.succeed(
  PaymentEventService,
  PaystackEvent,
);
