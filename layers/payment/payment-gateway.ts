import { type ConfigError, Context, type Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import { TaggedError } from "effect/Data";
import type { PaymentGatewayEventService } from "./payment-events";
import type {
  TCreateTransferRecipientData,
  TInitializeTransactionData,
  TInitiateTransferData,
} from "../../utils/paystack/type/data";
import type {
  TBankListResponse,
  TCreateTransferRecipientResponse,
  TinitializeResponse,
  TInitiateTransferResponse,
  TResolveAccountResponse,
} from "../../utils/paystack/type/types";

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

  bankLists(
    currency?: string,
  ): Effect.Effect<TBankListResponse, UnknownException, never>;

  resolveBankAccount(
    accountNumber: string,
    bankCode: string,
  ): Effect.Effect<TResolveAccountResponse, UnknownException, never>;

  createTransferRecipient(
    payload: TCreateTransferRecipientData,
  ): Effect.Effect<TCreateTransferRecipientResponse, UnknownException, never>;

  initiateTransfer(
    payload: TInitiateTransferData,
  ): Effect.Effect<TInitiateTransferResponse, UnknownException, never>;
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
