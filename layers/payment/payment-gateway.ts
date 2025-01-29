import { type ConfigError, Context, type Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import { TaggedError } from "effect/Data";
import type { PaymentGatewayEventService } from "./payment-events";
import type { TInitializeTransactionData } from "~/utils/paystack/type/data";
import type { TinitializeResponse } from "~/utils/paystack/type/types";

type TPaymentGateWayErrors =
  | ConfigError.ConfigError
  | PaymentVerificationError
  | PaymentGatewayError
  | UnknownException;

export type TPaymentGateway = {
  readonly provider: string;

  readonly createSession: (
    params: TInitializeTransactionData,
  ) => Effect.Effect<TinitializeResponse, UnknownException, never>;

  readonly verifyPayment: (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    params: any,
  ) => Effect.Effect<void, TPaymentGateWayErrors, PaymentGatewayEventService>;

  verifyWebhook: (
    payload: unknown,
    signature: string,
  ) => Effect.Effect<boolean, never>;

  /** Verifies the state of a payment event **/
  // cashout: () => void;
  // setupPayout: () => void;
  // getTransactions: () => Promise<void>;
};

export class PaymentGateway extends Context.Tag("PaymentGateway")<
  PaymentGateway,
  TPaymentGateway
>() {}

export class PaymentGatewayError extends TaggedError("PaymentGatewayError") {
  constructor(
    public message: string,
    public originalError: unknown,
  ) {
    super();
  }
}

export class PaymentVerificationError extends TaggedError(
  "PaymentVerificationError",
) {
  constructor(
    public message: string,
    public originalError: unknown,
  ) {
    super();
  }
}
