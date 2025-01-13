import { Effect, Layer } from "effect";
import { TOrderItem } from "~/migrations/tables/interfaces";
import {
  OrderItemsRepo,
  OrderItemsRepository,
} from "~/repositories/orderItems.repository";
import { extendMockImplementation } from "./helpers";

const orderItemsMock: OrderItemsRepository = {
  create(data: TOrderItem) {
    return Effect.succeed([
      {
        id: 1,
        orderId: "order-id",
        productId: "product-id",
        quantity: 1,
        createdAt: new Date(),
      },
    ]);
  },

  getItemsWithProductDetails(data) {
    return Effect.succeed({
      id: 1,
      orderId: "order-id",
      productId: "product-id",
      quantity: 1,
      productDetails: {
        locationId: "MOCK_LOCATION_ID",
      },
    });
  },
  firstOrThrow(cartSessionId) {
    return Effect.succeed({});
  },

  delete(cartSessionId) {
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

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendOrderItemsRepo = extendMockImplementation(
  OrderItemsRepo,
  () => {
    return orderItemsMock;
  },
);

export const OrderItemsRepoTest = Layer.succeed(OrderItemsRepo, orderItemsMock);
