import cuid2 from "@paralleldrive/cuid2";
import { safeJsonParse } from "@repo/shared/src/data.helpers";
import { Effect } from "effect";
import { head } from "effect/Array";
import { NoSuchElementException, UnknownException } from "effect/Cause";
import { isString } from "effect/Predicate";
import { ExpectedError } from "~/config/exceptions";
import type { CheckoutMetadata } from "~/dto/checkout.dto";
import { CheckoutManager } from "~/layers/payment/checkout-manager";
import {
  PaymentEvent,
  PaymentEventService,
} from "~/layers/payment/payment-events";
import { noResultMessage } from "~/libs/query.helpers";
import {
  CheckoutStoreRepo,
  CheckoutStoreRepoLive,
} from "~/repositories/checkout-store.repo";
import { getNonEmptyCart as ensureCartContainsItems } from "~/services/checkout.service";
import { createOrderFromCheckoutReference } from "~/services/order.service";
import { setLockStatus } from "./cart.services";
import { SearchOps } from "./search/sql-search-resolver";

export const getCheckoutPaymentId = (params: {
  total: number;
  checkoutReference: string;
}) => {
  return Effect.gen(function* (_) {
    const manager = yield* CheckoutManager;

    const intent = yield* manager.createPaymentIntent({
      // total * 100c = where total = 5 -> 5 * 100c = 5 dollars
      amount: Number((params.total * 100).toFixed()),
      currency: "CAD",
      metadata: {
        checkout_ref: params.checkoutReference,
      } satisfies CheckoutMetadata,
    });

    return {
      message: "Make payment with `paymentId`",
      provider: manager.provider,
      paymentId: intent.id,
    };
  });
};

// TODO: Move function to checkout.service.ts
export function persistCheckoutInfo(params: {
  paymentId: string;
  userId: string;
  cartId: string;
  reference: string;
  deliveryType: "home" | "pickup";
  addressId?: string;
}) {
  return Effect.gen(function* () {
    const repo = yield* CheckoutStoreRepo;

    yield* ensureCartContainsItems(params.cartId);
    yield* setLockStatus(params.cartId, "locked");

    const payload = {
      userId: params.userId,
      paymentId: params.paymentId,
      cartSessionId: params.cartId,
      reference: params.reference,
      deliveryType: params.deliveryType,
      metadata: { addressId: params?.addressId ?? undefined },
      paymentType: "card",
      status: "waiting" as const,
    };

    const result = yield* repo.create(payload).pipe(
      Effect.flatMap(head),
      Effect.flatMap((v) =>
        noResultMessage("Error storing checkout record")(v),
      ),
    );

    return result;
  }).pipe(Effect.provide(CheckoutStoreRepoLive));
}

export const generateReference = cuid2.init({ length: 10 });

export const handlePaymentEvents = (res: string, stripeSignature: string) => {
  return Effect.gen(function* (_) {
    const manager = yield* CheckoutManager;
    const paymentEvents = yield* PaymentEventService;

    yield* manager.verifyPayment({ body: res, signature: stripeSignature });
    const event = yield* _(
      safeJsonParse<Record<string, unknown>>(res),
      Effect.map((v) => paymentEvents.resolve(v)),
    );

    const metadata = yield* paymentEvents.getMetadata<CheckoutMetadata>(event);

    if (PaymentEvent.$is("PaymentFailure")(event)) {
      // TODO: unlock the cart when a payment fails
      // get the cartId from the checkoutRef and unlock the cart
      // yield* setLockStatus(metadata.checkout_ref, 'open')
    }

    if (!PaymentEvent.$is("PaymentSuccess")(event)) {
      yield* Effect.logDebug("Ignoring payment event");
      return;
    }

    if (!isString(metadata?.checkout_ref)) {
      yield* new ExpectedError(
        "Error: Successful payment events should have a `metadata.checkout_ref`",
      );
    }

    yield* Effect.logDebug(`Payment successful for (${metadata.checkout_ref})`);

    // use the checkout reference to create the order.
    yield* createOrderFromCheckoutReference({
      checkoutRef: String(metadata?.checkout_ref),
    });

    return;
  });
};

export function verifyPayment(params: { paymentRef: string }) {
  return Effect.gen(function* () {
    const checkoutRepo = yield* CheckoutStoreRepo;

    const count = yield* checkoutRepo.count(
      SearchOps.eq("paymentId", params.paymentRef),
    );

    if (count === 0) {
      yield* new NoSuchElementException("Payment reference not found.");
    }

    if (count > 1) {
      yield* new UnknownException(
        "Anomaly detected! Duplicate payment ID found",
      );
    }

    const checkoutInfo = yield* checkoutRepo.find({
      paymentId: params.paymentRef,
    });

    return checkoutInfo.status;
  });
}
