import { Effect, Layer } from "effect";
import { TPaymentOrder } from "~/migrations/tables/interfaces";
import {
  PaymentOrderRepo,
  PaymentOrderRepository,
} from "~/repositories/payment-order.repository";
import { extendMockImplementation } from "./helpers";

const paymentOrderMock: PaymentOrderRepository = {
  create(data: TPaymentOrder) {
    return Effect.succeed([
      {
        id: 1,
        paymentId: "payment-id",
        orderId: "order-id",
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

export const extendPaymentOrderRepo = extendMockImplementation(
  PaymentOrderRepo,
  () => paymentOrderMock,
);

export const PaymentOrderRepoTest = Layer.succeed(
  PaymentOrderRepo,
  paymentOrderMock,
);
