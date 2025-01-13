import { Effect, Layer } from "effect";
import { CartRepo, type CartRepository } from "~/repositories/cart.repository";
import { extendMockImplementation } from "./helpers";

const cartMock: CartRepository = {
  create(data) {
    return Effect.succeed([
      {
        cartId: "cart-id",
        cartSessionId: "cart-session-id",
        createdAt: new Date(),
        status: "open",
      },
    ]);
  },

  firstOrThrow(cartSessionId) {
    return Effect.succeed({
      cartId: "cart-id",
      cartSessionId: "cart-session-id",
      createdAt: new Date(),
    });
  },

  delete(cartSessionId) {
    return Effect.succeed([
      {
        cartId: "cart-id",
        cartSessionId: cartSessionId,
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

  find: () => {
    throw new Error("Function not implemented.");
  },

  update: () => {
    return Effect.succeed([{}]);
  },

  findWithItems() {
    return Effect.succeed({
      cartId: "cart-id",
      cartSessionId: "cart-session-id",
      createdAt: new Date(),
      status: "open",
      items: [],
    });
  },
};

export const extendCartRepo = extendMockImplementation(
  CartRepo,
  () => cartMock,
);

export const CartRepoTest = Layer.succeed(CartRepo, cartMock);
