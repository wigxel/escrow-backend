import { type ConfigError, Context, type Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import { TaggedClass, TaggedError } from "effect/Data";
import type { PaymentEventService } from "./payment-events";

type CheckoutErrors =
  | ConfigError.ConfigError
  | PaymentVerificationError
  | CheckoutError
  | UnknownException;

export type TCheckoutManager = {
  readonly provider: string;

  readonly createPaymentIntent: (params: {
    amount: number;
    currency: string;
    metadata: Record<string, string | number>;
  }) => Effect.Effect<PaymentIntent, CheckoutErrors, never>;

  readonly createSession: (
    params: CreateSessionParams,
  ) => Effect.Effect<{ checkoutId: string }, CheckoutErrors, never>;

  readonly verifyPayment: (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    params: any,
  ) => Effect.Effect<void, CheckoutErrors, PaymentEventService>;

  /** Verifies the state of a payment event **/
  // cashout: () => void;
  // setupPayout: () => void;
  // verifyPayment: () => void;
  // verifyWebhook: () => void;
  // getTransactions: () => Promise<void>;
};

export type CreateSessionParams = {
  successUrl: string;
  cancelUrl: string;
  userInfo: { email: string };
  items: CheckoutItemInterface[];
};

export class CheckoutManager extends Context.Tag("CheckoutManager")<
  CheckoutManager,
  TCheckoutManager
>() {}

export class PaymentIntent extends TaggedClass("PaymentIntent")<{
  id: string;
  // biome-ignore lint/suspicious/noExplicitAny: Intent struct greatly differ
  payload: any;
}> {}

export type CheckoutItemInterface = {
  quantity: number;
  productData: {
    name: string;
  } & Record<string, unknown>;
  price: {
    currency: string;
    amount: number;
    unitAmount: number; // the small unit
  };
};

export class CheckoutItem extends TaggedClass(
  "CheckoutItem",
)<CheckoutItemInterface> {}

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
