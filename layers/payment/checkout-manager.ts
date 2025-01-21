import { type ConfigError, Context, type Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import { TaggedError } from "effect/Data";
import type { PaymentEventService } from "./payment-events";
import type { TInitializeTransactionData } from "~/utils/paystack/type/data";
import type { TinitializeResponse } from "~/utils/paystack/type/types";

type CheckoutErrors =
  | ConfigError.ConfigError
  | PaymentVerificationError
  | CheckoutError
  | UnknownException;

export type TCheckoutManager = {
  readonly provider: string;

  readonly createSession: (
    params: TInitializeTransactionData,
  ) => Effect.Effect<TinitializeResponse, UnknownException, never>;

  readonly verifyPayment: (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    params: any,
  ) => Effect.Effect<void, CheckoutErrors, PaymentEventService>;

  verifyWebhook: (payload:unknown, signature:string) => Effect.Effect<boolean,never>;

  /** Verifies the state of a payment event **/
  // cashout: () => void;
  // setupPayout: () => void;
  // getTransactions: () => Promise<void>;
};


export class CheckoutManager extends Context.Tag("CheckoutManager")<
  CheckoutManager,
  TCheckoutManager
>() {}


export class CheckoutError extends TaggedError("CheckoutError") {
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
