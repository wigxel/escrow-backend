import { Effect, Layer } from "effect";
import {
  CartItemsRepo,
  CartItemsRepository,
} from "~/repositories/cartItems.repository";
import { extendMockImplementation } from "./helpers";

const cartItemsMock: CartItemsRepository = {
  create(data) {
    return Effect.succeed([
      {
        cartId: "cart-id",
        cartItemId: 1,
        productId: "product-id",
        quantity: 1,
        createdAt: new Date(2024, 6, 30),
      },
    ]);
  },

  firstOrThrow(arg1, arg2) {
    return Effect.succeed({
      cartId: "cart-id",
      cartItemId: 1,
      productId: "product-id",
      quantity: 1,
      createdAt: new Date(2024, 6, 30),
    });
  },

  update(data: {
    productId: string;
    cartId: string;
    quantity: number;
  }) {
    return Effect.succeed([
      {
        cartId: data.cartId,
        cartItemId: 1,
        productId: data.productId,
        quantity: data.quantity,
        createdAt: new Date(2024, 6, 30),
      },
    ]);
  },

  getCartItems(cartId) {
    return Effect.succeed([
      {
        cartId: cartId,
        cartItemId: 1,
        productId: "product-id",
        quantity: 1,
        createdAt: new Date(2024, 6, 30),
        productDetails: {
          name: "product name",
          price: "2300",
          ownerId: "seller-id",
          locationId: "MOCK_LOCATION_ID",
        },
        productImage: { imageUrl: "image.jpg" },
      },
    ]);
  },

  delete(cartId) {
    return Effect.succeed([
      {
        cartId: cartId,
        cartItemId: 1,
        productId: "product-id",
        quantity: 1,
        createdAt: new Date(2024, 6, 30),
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
};

export const extendCartItemsRepo = extendMockImplementation(
  CartItemsRepo,
  () => cartItemsMock,
);

export const CartItemRepoTest = Layer.succeed(CartItemsRepo, cartItemsMock);
