import { Context, Data, type Option } from "effect";

export type PaymentGatewayEvents = Data.TaggedEnum<{
  ChargeSuccess: { readonly data: object };
  Chargefailed: { readonly data: object };
  UnknownPaymentEvent: { readonly data: unknown };
}>;

export interface PaymentEventServiceImpl {
  /** Resolves the event object to a PaymentEvent struct **/
  resolve(object: unknown): PaymentGatewayEvents;

  /** Extracts Metadata from the payment event **/
  getMetadata<T extends Record<string, unknown>>(
    event: PaymentGatewayEvents,
  ): Option.Option<T>;
}

export class PaymentGatewayEventService extends Context.Tag("PaymentGatewayEventService")<
  PaymentGatewayEventService,
  PaymentEventServiceImpl
>() {}

export const PaymentGatewayEvent = Data.taggedEnum<PaymentGatewayEvents>();

