import { Effect, Layer } from "effect";
import { TOrderDetail } from "~/migrations/tables/interfaces";
import { OrderRepo, OrderRepository } from "~/repositories/order.repository";
import { FindArg1, FindArg2 } from "~/services/repository/repo.types";
import { extendMockImplementation } from "./helpers";

const orderMock: OrderRepository = {
  // @ts-expect-error
  create(data: TOrderDetail) {
    return Effect.succeed([
      {
        id: "order-id",
        deliveryType: "home",
        paymentId: "payment-id",
        sellerId: "seller-id",
        status: "status",
        total: "200",
        userId: "user-id",
        createdAt: new Date(),
      },
    ]);
  },

  // @ts-expect-error
  getOrderByUser(where) {
    return Effect.succeed([
      {
        id: "order-id",
        deliveryType: "home",
        paymentId: "payment-id",
        sellerId: "seller-id",
        status: "status",
        total: "200",
        userId: "user-id",
        createdAt: new Date(),
        paymentDetails: {},
        orderItems: [{}],
      },
    ]);
  },

  // @ts-expect-error
  getSingleOrder(where) {
    return Effect.succeed({
      id: "order-id",
      deliveryType: "home",
      paymentId: "payment-id",
      sellerId: "seller-id",
      buyerId: "buyer-id",
      status: "status",
      total: "200",
      userId: "user-id",
      createdAt: new Date(),
      paymentDetails: { status: "success" },
      orderItems: [{}],
    });
  },

  update(where, data: Record<string, unknown>) {
    return Effect.succeed([
      {
        id: "order-id",
        deliveryType: "home",
        paymentId: "payment-id",
        sellerId: "seller-id",
        status: "delivered",
        total: "200",
        userId: "user-id",
        createdAt: new Date(),
        paymentDetails: {},
        orderItems: [{}],
        ...data,
      },
    ]);
  },

  // @ts-expect-error
  find<Arg1 extends FindArg1>(arg1: Arg1, arg2?: FindArg2) {
    return Effect.succeed([
      {
        id: "order-id",
        deliveryType: "home",
        paymentId: "payment-id",
        sellerId: "seller-id",
        status: "delivered",
        total: "200",
        userId: "user-id",
        createdAt: new Date(),
        paymentDetails: {},
        orderItems: [{}],
      },
    ]);
  },

  all() {
    return Effect.succeed([
      {
        id: "order-id",
        deliveryType: "home",
        paymentId: "payment-id",
        sellerId: "seller-id",
        status: "delivered",
        total: "200",
        userId: "user-id",
        createdAt: new Date(),
        paymentDetails: {},
        orderItems: [{}],
      },
    ]);
  },
};

export const extendOrderRepo = extendMockImplementation(
  OrderRepo,
  () => orderMock,
);

export const OrderRepoTest = Layer.succeed(OrderRepo, orderMock);
