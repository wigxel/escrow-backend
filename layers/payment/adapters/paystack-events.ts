import { Layer, Match, Option, pipe } from "effect";
import {
  PaymentGatewayEvent,
  type PaymentGatewayEvents,
  PaymentGatewayEventService,
} from "~/layers/payment/payment-events";

export const PaystackEvent = PaymentGatewayEventService.of({
  resolve(ev: object) {
    return pipe(
      Match.value(ev),
      Match.when({ event: "charge.success" }, PaymentGatewayEvent.ChargeSuccess),
      Match.when({ event: "charge.failed" }, PaymentGatewayEvent.Chargefailed),
      Match.orElse((data) => PaymentGatewayEvent.UnknownPaymentEvent({ data })),
    );
  },

  getMetadata(event: PaymentGatewayEvents) {
    return pipe(
      event,
      PaymentGatewayEvent.$match({
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
  PaymentGatewayEventService,
  PaystackEvent,
);
