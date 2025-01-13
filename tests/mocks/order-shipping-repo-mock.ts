import { Effect, Layer } from "effect";
import {
  OrderShippingRepo,
  type ShippingRepository,
} from "~/repositories/order-shipping.repository";
import { extendMockImplementation } from "./helpers";

const mockInstance: ShippingRepository = {
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

export const extendDeliveryDetailsRepo = extendMockImplementation(
  OrderShippingRepo,
  () => mockInstance,
);

export const DeliveryDetailsRepoTest = Layer.succeed(
  OrderShippingRepo,
  mockInstance,
);
