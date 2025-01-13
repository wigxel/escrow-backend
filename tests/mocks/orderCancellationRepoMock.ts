import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";
import {
  OrderStatusHistoryRepo,
  OrderStatusHistoryRepository,
} from "~/repositories/orderStatusHistory.repo";
import {
  OrderCancellationRepo,
  OrderCancellationRepository,
} from "~/repositories/orderCancellation.repo";

const orderCancellationMock: OrderCancellationRepository = {
  create(data) {
    return Effect.succeed([]);
  },

  firstOrThrow(arg1, arg2) {
    return Effect.succeed({});
  },

  update() {
    return Effect.succeed([]);
  },

  delete(cartId) {
    return Effect.succeed([]);
  },

  all: (params) => {
    return Effect.succeed([]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  find: () => {
    throw new Error("Function not implemented.");
  },
};

export const extendOrderCancellationRepo = extendMockImplementation(
  OrderCancellationRepo,
  () => orderCancellationMock,
);

export const OrderCancellationRepoTest = Layer.succeed(
  OrderCancellationRepo,
  orderCancellationMock,
);
