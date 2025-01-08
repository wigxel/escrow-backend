import { Config, Effect, Layer, pipe, Secret, Redacted } from "effect";
import { UnknownException } from "effect/Cause";
import { isError } from "effect/Predicate";
import Stripe from "stripe";
import { StripeEventLive } from "~/layers/payment/adapters/stripe-events";
import {
  CheckoutError,
  CheckoutManager,
  type CreateSessionParams,
  PaymentIntent,
  PaymentVerificationError,
  type TCheckoutManager,
} from "~/layers/payment/checkout-manager";

class StripeCheckout implements TCheckoutManager {
  provider = "Stripe";

  constructor(private stripe: Stripe) {}

  createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: Record<string, string | number>;
  }) {
    const { amount, currency } = params;

    const readPaymentIntent = this.stripe.paymentIntents.create({
      amount,
      currency: currency,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: params.metadata,
    });

    // return paymentIntent.client_secret;
    return Effect.tryPromise({
      try: () => readPaymentIntent,
      catch: (error) => {
        if (isError(error)) return new CheckoutError(error?.message, error);
        return new UnknownException(error);
      },
    }).pipe(
      Effect.map((paymentIntent) => {
        return new PaymentIntent({
          id: paymentIntent.client_secret,
          payload: paymentIntent,
        });
      }),
    );
  }

  createSession(payload: CreateSessionParams) {
    const session = Effect.tryPromise(() => {
      return this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: payload.items.map((item) => ({
          price_data: {
            currency: item.price.currency,
            product_data: item.productData,
            unit_amount: item.price.unitAmount,
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: payload.successUrl,
        cancel_url: payload.cancelUrl,
        customer_email: payload.userInfo.email,
      });
    });

    return session.pipe(Effect.map((e) => ({ checkoutId: e.id })));
  }

  verifyPayment(data: {
    body: string;
    signature: string;
  }) {
    const stripe = this.stripe;
    return Effect.gen(function* (_) {
      const webhook_secret = yield* Config.string(
        "STRIPE_WEBHOOK_SIGNING_SECRET",
      );

      yield* Effect.try({
        try() {
          return stripe.webhooks.constructEvent(
            data.body,
            data.signature,
            webhook_secret,
          );
        },
        catch(error) {
          return new PaymentVerificationError(
            "Stripe Payment verification failed",
            error,
          );
        },
      });
    });
  }
}

export const StripeCheckoutLive = pipe(
  Config.all([
    Config.string("STRIPE_WEBHOOK_SIGNING_SECRET"),
    Config.redacted("STRIPE_SECRET_KEY"),
  ]),
  Effect.map(([, redacted_secret]) => {
    const stripe = new Stripe(Redacted.value(redacted_secret));

    return Layer.effect(
      CheckoutManager,
      pipe(
        Effect.suspend(() => Effect.succeed(new StripeCheckout(stripe))),
        Effect.provide(StripeEventLive),
      ),
    );
  }),
  Layer.unwrapScoped,
);
