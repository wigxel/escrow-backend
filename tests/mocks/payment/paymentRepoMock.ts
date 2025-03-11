import { Effect, Layer } from "effect";
import type { PaymentDetail } from "~/migrations/tables/interfaces";

import {
  PaymentRepo,
  type PaymentRepository,
} from "~/repositories/payment.repository";
import { extendMockImplementation } from "../helpers";

const PaymentMock: PaymentRepository = {
  create(data: PaymentDetail) {
    return Effect.succeed([
      {
        amount: data.amount,
        paymentId: data.paymentId,
        paymentType: data.paymentType,
        provider: data.provider,
        status: data.status,
        createdAt: new Date(),
      },
    ]);
  },
  all: (params) => {
    return Effect.succeed([]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  delete: (params) => {
    return Effect.void;
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow(arg1) {
    throw new Error("Function not implemented.");
  },

  update: () => {
    throw new Error("Function not implemented.");
  },
};

export const extendPaymentRepo = extendMockImplementation(
  PaymentRepo,
  () => PaymentMock,
);

export const PaymentRepoTest = Layer.succeed(PaymentRepo, PaymentMock);
