import { Context, Data, type Option } from "effect";

export type PaymentEvents = Data.TaggedEnum<{
  ChargeSuccess: { readonly data: object };
  Chargefailed:{readonly data: object};
  UnknownPaymentEvent: { readonly data: unknown };
}>;

export const PaymentEvent = Data.taggedEnum<PaymentEvents>();

export interface PaymentEventServiceImpl {
  /** Resolves the event object to a PaymentEvent struct **/
  resolve(object: unknown): PaymentEvents;

  /** Extracts Metadata from the payment event **/
  getMetadata<T extends Record<string, unknown>>(
    event: PaymentEvents,
  ): Option.Option<T>;
}

export class PaymentEventService extends Context.Tag("PaymentEventService")<
  PaymentEventService,
  PaymentEventServiceImpl
>() {}
