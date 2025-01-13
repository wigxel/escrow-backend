import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";
import {
  OrderStatusHistoryRepo,
  OrderStatusHistoryRepository,
} from "~/repositories/orderStatusHistory.repo";

const orderStatusHistoryMock: OrderStatusHistoryRepository = {
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

export const extendOrderStatusHistoryRepo = extendMockImplementation(
  OrderStatusHistoryRepo,
  () => orderStatusHistoryMock,
);

export const OrderStatusHistoryRepoTest = Layer.succeed(
  OrderStatusHistoryRepo,
  orderStatusHistoryMock,
);
