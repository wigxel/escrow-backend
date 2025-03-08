import { Effect, Layer } from "effect";
import {
  PaymentGateway,
  type TPaymentGateway,
} from "~/layers/payment/payment-gateway";
import { extendMockImplementation } from "../helpers";
import type {
  TBankListResponse,
  TCreateTransferRecipientResponse,
  TInitiateTransferResponse,
} from "~/utils/paystack/type/types";

const mock: TPaymentGateway = {
  createSession() {
    return Effect.succeed({
      data: {
        access_code: "access-code",
        authorization_url: "authorization-url",
        reference: "reference-id",
      },
      message: "",
      status: "success",
    });
  },

  bankLists() {
    return Effect.succeed({
      data: [
        { name: "bank name", code: "112", active: "active", id: "bank-id" },
      ],
      message: "",
      status: "",
    } as TBankListResponse);
  },

  verifyPayment() {
    return Effect.succeed(1);
  },

  verifyWebhook() {
    return Effect.succeed(true);
  },

  resolveBankAccount() {
    return Effect.succeed({
      data: {
        account_name: "account-name",
        account_number: "111110000",
        bank_id: "234",
      },
      status: "success",
      message: "",
    });
  },

  createTransferRecipient() {
    return Effect.succeed({
      data: {
        recipient_code: "res-112",
        name: "",
        active: true,
        details: {
          account_name: "account-name",
          bank_code: "234",
          bank_name: "gtb",
          account_number: "1111111",
          authorization_code: "auth_code",
        },
      },
      message: "transfer recipient created",
      status: "success",
    } as TCreateTransferRecipientResponse);
  },

  //@ts-expect-error
  initiateTransfer() {
    return Effect.succeed({
      data: {
        amount: "3000",
        reference: "ref_no",
        status: "success",
        id: "id",
        reason: "reason",
      },
      message: "Transfer initialization success",
      status: "success",
    });
  },
};

export const PaymentGatewayTestLive = Layer.succeed(PaymentGateway, mock);
export const extendPaymentGateway = extendMockImplementation(
  PaymentGateway,
  () => mock,
);
