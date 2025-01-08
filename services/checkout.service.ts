import { Effect } from "effect";
import { head } from "effect/Array";
import type Stripe from "stripe";
import type { z } from "zod";
import { CheckoutSuccessfulMail } from "~/app/mail/checkout-successful";
import { NotificationSetup } from "~/app/notifications/notification.utils";
import { ExpectedError } from "~/config/exceptions";
import type {
  TCheckoutPackage,
  authCheckoutSchema,
  checkoutSchema,
} from "~/dto/checkout.dto";
import { Mail } from "~/layers/mailing/mail";
import { CartRepoLayer } from "~/repositories/cart.repository";
import { CartItemsRepoLayer } from "~/repositories/cartItems.repository";
import { OrderRepoLayer } from "~/repositories/order.repository";
import { OrderItemsRepoLayer } from "~/repositories/orderItems.repository";
import { PaymentOrderRepoLayer } from "~/repositories/payment-order.repository";
import { PaymentRepoLayer } from "~/repositories/payment.repository";
import { ProductRepoLayer } from "~/repositories/product.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { sendNotification } from "~/services/notification.service";
import { SearchOps } from "~/services/search/sql-search-resolver";
import { PaymentServiceLayer } from "~/services/stripe.service";
import {
  calculateCheckoutSummary,
  findSamePackage,
  groupCartItemsIntoPackages,
} from "~/utils/cart.util";

export const checkout = (cartSessionId: string, currentUserId?: string) => {
  return Effect.suspend(() => {
    return Effect.gen(function* (_) {
      const cartRepo = yield* CartRepoLayer.Tag;
      const cartItemsRepo = yield* CartItemsRepoLayer.Tag;
      const userRepo = yield* UserRepoLayer.Tag;

      const userDetails = currentUserId
        ? yield* userRepo.firstOrThrow({ id: currentUserId })
        : null;

      const cart = yield* _(
        cartRepo.firstOrThrow({ cartSessionId }),
        Effect.mapError(
          () => new ExpectedError("No available cart for the session"),
        ),
      );

      const cartItems = yield* _(cartItemsRepo.getCartItems(cart.cartId));

      // calculate all total & sub prices
      const modCartItems = calculateCheckoutSummary(cartItems);

      return {
        authenticated: !!currentUserId,
        userDetails,
        data: {
          packages: groupCartItemsIntoPackages(modCartItems.newCartItems),
          subTotal: modCartItems.subPrice,
          total: modCartItems.subPrice,
        },
      };
    });
  });
};

export function getNonEmptyCart(cartId: string) {
  return Effect.gen(function* (_) {
    const cartRepo = yield* CartRepoLayer.Tag;
    const cartItemsRepo = yield* CartItemsRepoLayer.Tag;

    // get the cart id
    const cart = yield* _(
      cartRepo.firstOrThrow({ cartSessionId: cartId }),
      Effect.mapError(
        () =>
          new ExpectedError(
            "invalid cartSession: cannot proceed with checkout",
          ),
      ),
    );

    // get all cart items
    const cartItems = yield* cartItemsRepo.getCartItems(cart.cartId);
    if (!cartItems.length) {
      yield* new ExpectedError("Cart is empty cannot proceed with checkout");
    }

    return { cart, cartItems };
  });
}

/**
 * @deprecated No longer needed
 */
export const processCheckout = (
  data: z.infer<typeof authCheckoutSchema> & z.infer<typeof checkoutSchema>,
  currentUserId?: string,
) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const stripe = yield* PaymentServiceLayer.Tag;

    const { cartItems } = yield* getNonEmptyCart(data.csID);

    // if not logged in create new account for the user
    const user = yield* _(
      userRepo.firstOrThrow({ id: currentUserId }),
      Effect.mapError(
        () => new ExpectedError("invalid user: user does not exist "),
      ),
    );

    if (user.role !== "BUYER") {
      yield* new ExpectedError("Only Buyer's account can purchase products");
    }

    const MetaData = {
      csID: data.csID,
      buyerId: user.id,
      packages: JSON.stringify(data.packages),
    };

    // returns the checkout session
    const session = yield* stripe.createCheckoutSession(cartItems, MetaData);

    return { data: { sessionId: session.id, sessionUrl: session.url } };
  });
};

/**
 * @deprecated
 * @param res - contains payload from stripe
 * @param stripeSignature stripe-signature gotten from the header
 */
export const completeCheckout = (res: string, stripeSignature: string) => {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
    const userRepo = yield* UserRepoLayer.Tag;
    const cartRepo = yield* CartRepoLayer.Tag;
    const cartItemsRepo = yield* CartItemsRepoLayer.Tag;
    const paymentRepo = yield* PaymentRepoLayer.Tag;
    const orderRepo = yield* OrderRepoLayer.Tag;
    const orderItemsRepo = yield* OrderItemsRepoLayer.Tag;
    const paymentOrderRepo = yield* PaymentOrderRepoLayer.Tag;
    const prodRepo = yield* ProductRepoLayer.Tag;
    const stripe = yield* PaymentServiceLayer.Tag;

    const event = yield* stripe.constructWebhookEvent(res, stripeSignature);
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const csID = session.metadata?.csID;
    const notifyHelper = new NotificationSetup("checkout");

    if (event.type !== "checkout.session.completed") {
      yield* new ExpectedError("event.type must be checkout.session.completed");
    }

    // make sure user exists
    const user = yield* userRepo
      .firstOrThrow({ id: userId })
      .pipe(
        Effect.mapError(
          () => new ExpectedError("invalid user: user does not exist"),
        ),
      );

    // get the cart id
    const cart = yield* _(
      cartRepo.firstOrThrow({ cartSessionId: csID }),
      Effect.mapError(
        () =>
          new ExpectedError(
            "invalid cartSession: cannot proceed with checkout",
          ),
      ),
    );
    /**
     * Parse package data
     */
    const checkoutPackages: Array<TCheckoutPackage> = JSON.parse(
      session.metadata?.packages,
    );

    // get all cart items
    const cartItems = yield* cartItemsRepo.getCartItems(cart.cartId);

    if (!cartItems.length) {
      yield* new ExpectedError("Cart is empty cannot proceed with checkout");
    }

    const packages = groupCartItemsIntoPackages(cartItems);

    if (!(packages.length === checkoutPackages.length)) {
      yield* new ExpectedError(
        "Error: Package items not consistent with cart items",
      );
    }

    // create payment
    const payment = yield* paymentRepo
      .create({
        amount: String(session.amount_total),
        paymentType: "card",
        status: "success",
      })
      .pipe(Effect.flatMap(head));

    // create the orderDetails
    for (let i = 0; i < packages.length; i++) {
      const packageItem = packages[i];
      /**
       * Match received checkoutPackage with packages generate from cartItems
       */
      const samePackage = findSamePackage(packageItem, checkoutPackages);
      const orderDetails = yield* orderRepo
        .create({
          //id of the user buying
          buyerId: user.id,
          sellerId: samePackage.sellerId,
          total: String(calculateOrderTotalPrice(packageItem.items)),
          // deliveryType: samePackage.deliveryType,
          status: "pending",
          paymentId: payment.paymentId,
        })
        .pipe(Effect.flatMap(head));

      // keeps track of orders linked to a payment
      yield* paymentOrderRepo.create({
        paymentId: payment.paymentId,
        orderId: orderDetails.id,
      });

      //add products to order items
      for (const item of packageItem.items) {
        yield* orderItemsRepo.create({
          orderId: orderDetails.id,
          productId: item.productId,
          quantity: item.quantity,
        });

        //adjust product stock
        yield* prodRepo.update(
          { ownerId: orderDetails.sellerId, id: item.productId },
          {
            stock:
              item.productDetails.stock > 0 ? item.productDetails.stock - 1 : 0,
          },
        );
      }

      // send in app notification to buyer
      yield* sendNotification(
        notifyHelper.createMessage({
          type: "preset",
          name: "checkout",
          receiverId: user.id,
          meta: {
            orderId: orderDetails.id,
            triggeredBy: { role: "BUYER", id: user.id },
          },
        }),
      );

      //send in-app notification to the seller
      yield* sendNotification(
        notifyHelper.createMessage({
          type: "preset",
          name: "newOrder",
          receiverId: orderDetails.sellerId,
          meta: {
            orderId: orderDetails.id,
            triggeredBy: { role: "BUYER", id: user.id },
          },
        }),
      );
    }

    // delete the cart
    yield* cartRepo.delete(SearchOps.eq("cartSessionId", csID));

    yield* mail
      .to([user.email, user.firstName])
      .send(new CheckoutSuccessfulMail());

    return { status: true };
  });
};
