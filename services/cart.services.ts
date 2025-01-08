import { Effect } from "effect";
import { head } from "effect/Array";
import { NoSuchElementException } from "effect/Cause";
import { randomUUID } from "uncrypto";
import { ExpectedError } from "~/config/exceptions";
import { CartRepo, CartRepoLayer } from "~/repositories/cart.repository";
import { CartItemsRepoLayer } from "~/repositories/cartItems.repository";
import { ProductRepoLayer } from "~/repositories/product.repository";
import { calculateCheckoutSummary } from "~/utils/cart.util";
import { SearchOps } from "./search/sql-search-resolver";

// [MISSING FEATURES]
// Cross platform cart syncing.
// A customer adds an item to their cart on their phone
// and later continues from a Laptop device and finishes up on their Tablet.

/**
 * Add a product to cart
 */
export const addToCart = (data: {
  productId: string;
  currentSessionId: string | undefined;
}) => {
  return Effect.gen(function* (_) {
    const cartRepo = yield* CartRepoLayer.Tag;
    const cartItemRepo = yield* CartItemsRepoLayer.Tag;
    const prodRepo = yield* ProductRepoLayer.Tag;
    const sessionId = data.currentSessionId ?? randomUUID();

    const productDetails = yield* prodRepo
      .firstOrThrow(data.productId)
      .pipe(
        Effect.catchTag(
          "NoSuchElementException",
          () => new NoSuchElementException("Product not found"),
        ),
      );

    const productPublished = productDetails.published === true;

    // make sure the property to add to the cart is published
    if (!productPublished) {
      yield* new ExpectedError(
        "Unable to add product to cart. Product doesn't exists",
      );
    }

    if (productDetails.stock < 1) {
      yield* new ExpectedError("This product or item is out of stock");
    }

    /* Check if there is a cart for the current session id */
    const cart = yield* _(
      cartRepo.firstOrThrow({ cartSessionId: sessionId, status: "open" }),
      Effect.matchEffect({
        onFailure: () =>
          cartRepo
            .create({ cartSessionId: sessionId })
            .pipe(Effect.flatMap(head)),
        onSuccess: (v) => Effect.succeed(v),
      }),
    );

    const createNewItem = cartItemRepo
      .create({
        cartId: cart.cartId,
        productId: data.productId,
        quantity: 1,
      })
      .pipe(Effect.flatMap(head));

    // get product in cart_item
    yield* _(
      cartItemRepo.firstOrThrow({
        productId: data.productId,
        cartId: cart.cartId,
      }),
      Effect.flatMap((v) => {
        const new_qty = v.quantity + 1;

        if (new_qty > productDetails.stock) {
          return new ExpectedError(
            `Quantity Exceeds Stock: Only ${productDetails.stock} available.`,
          );
        }

        // increment the  cart_item quantity by one
        return cartItemRepo.update(
          {
            cartId: cart.cartId,
            productId: data.productId,
          },
          { quantity: new_qty },
        );
      }),
      Effect.catchTag("NoSuchElementException", () => createNewItem),
    );

    return {
      status: true,
      sessionId,
    };
  });
};

export const removeFromCart = (data: {
  productId: string;
  currentSessionId: string;
}) => {
  return Effect.gen(function* (_) {
    const cartRepo = yield* CartRepoLayer.Tag;
    const cartItemRepo = yield* CartItemsRepoLayer.Tag;

    /* Check if there is a cart for the current session id */
    const cart = yield* _(
      cartRepo.firstOrThrow({
        cartSessionId: data.currentSessionId,
        status: "open",
      }),
      Effect.mapError(() => new ExpectedError("Invalid cart session id")),
    );

    // get product in cart_item
    yield* cartItemRepo
      .firstOrThrow({
        productId: data.productId,
        cartId: cart.cartId,
      })
      .pipe(
        Effect.mapError(
          () => new ExpectedError("Unable to delete: product not in cart"),
        ),
      );

    // delete the product from cart
    yield* cartItemRepo.delete(
      SearchOps.and(
        SearchOps.eq("cartId", cart.cartId),
        SearchOps.eq("productId", data.productId),
      ),
    );

    return {
      status: true,
    };
  });
};

export const getAllCartItems = (data: {
  currentSessionId?: string;
}) => {
  return Effect.gen(function* (_) {
    const cartRepo = yield* CartRepoLayer.Tag;
    const cartItemRepo = yield* CartItemsRepoLayer.Tag;

    /* If currentSessionId is undefined cancel delete operation */
    if (data.currentSessionId === undefined) {
      return {
        data: {
          cartItems: [],
          subTotalPrice: 0,
          total: 0,
        },
        status: true,
      };
    }

    /* Check if there is a cart for the current session id */
    const cart = yield* _(
      cartRepo.firstOrThrow({ cartSessionId: data.currentSessionId }),
      Effect.catchTag(
        "NoSuchElementException",
        (err) => new ExpectedError("Cart not found"),
      ),
    );

    // get and return allCartItems
    const cartItems = yield* cartItemRepo.getCartItems(cart.cartId);

    // calculate all total & sub prices
    const modCartItems = calculateCheckoutSummary(cartItems);

    return {
      data: {
        cartItems: modCartItems.newCartItems,
        subTotalPrice: modCartItems.subPrice,
        total: modCartItems.subPrice,
      },
      status: true,
    };
  });
};

export const deleteCart = (data: {
  currentSessionId: string;
}) => {
  return Effect.gen(function* (_) {
    const cartRepo = yield* CartRepoLayer.Tag;

    /* Check if there is a cart for the current session id */
    yield* _(
      cartRepo.firstOrThrow({
        cartSessionId: data.currentSessionId,
        status: "open",
      }),
      Effect.mapError(() => new ExpectedError("Invalid cart session id")),
    );

    yield* cartRepo.delete(
      SearchOps.eq("cartSessionId", data.currentSessionId),
    );

    return { data: [], status: true };
  });
};

export const updateCartQuantity = (data: {
  quantity: number;
  productId: string;
  currentSessionId: string;
}) => {
  return Effect.gen(function* (_) {
    const cartRepo = yield* CartRepoLayer.Tag;
    const prodRepo = yield* ProductRepoLayer.Tag;
    const cartItemRepo = yield* CartItemsRepoLayer.Tag;

    if (data.quantity < 1) {
      yield* new ExpectedError("Minimum of 1 quantity required");
    }

    /* Check if there is a cart for the current session id */
    const cart = yield* _(
      cartRepo.firstOrThrow({
        cartSessionId: data.currentSessionId,
        status: "open",
      }),
      Effect.mapError(() => new ExpectedError("Cart not found")),
    );

    // get product in cart_item
    const productInCart = yield* cartItemRepo
      .firstOrThrow({
        productId: data.productId,
        cartId: cart.cartId,
      })
      .pipe(Effect.mapError(() => new ExpectedError("Product not in cart")));

    // get the product details
    const productDetails = yield* prodRepo
      .firstOrThrow({ id: productInCart.productId })
      .pipe(
        Effect.catchTag(
          "NoSuchElementException",
          () => new NoSuchElementException("Product not found"),
        ),
      );

    if (data.quantity > productDetails.stock) {
      yield* new ExpectedError(
        `Quantity exceeds stocks: only ${productDetails.stock} available`,
      );
    }

    yield* cartItemRepo.update(
      {
        cartId: cart.cartId,
        productId: data.productId,
        // TODO: [TEST] Add test case for Cart OPEN & LOCKED status
        status: "open",
      },
      { quantity: data.quantity },
    );

    return {
      status: true,
    };
  });
};

/** Locks or Unlocks a cart to mutation */
export function setLockStatus(cartId: string, status: "open" | "locked") {
  return Effect.gen(function* () {
    const service = yield* CartRepo;

    yield* service.update(
      { cartSessionId: cartId },
      {
        status: status,
      },
    );

    return;
  });
}
