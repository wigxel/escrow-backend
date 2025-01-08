import { Config, type ConfigError, Context, Effect, Layer } from "effect";
import Stripe from "stripe";
import { ExpectedError } from "~/config/exceptions";
import type { TCartItem } from "~/dto/checkout.dto";

export interface IPaymentService {
  createCheckoutSession: (
    items: TCartItem[],
    meta: Record<string, string | number>,
  ) => Effect.Effect<
    Stripe.Response<Stripe.Checkout.Session>,
    ExpectedError | ConfigError.ConfigError,
    never
  >;

  constructWebhookEvent: (
    body: string,
    sig: string,
  ) => Effect.Effect<
    Stripe.Event,
    ExpectedError | ConfigError.ConfigError,
    never
  >;
}

export class StripePayment implements IPaymentService {
  constructor(private stripe: Stripe) {}

  createCheckoutSession = (
    items: TCartItem[],
    meta: Record<string, string | number>,
  ) => {
    const stripe = this.stripe;

    return Effect.gen(function* () {
      const SUCCESS_URL = yield* Config.string("SUCCESS_URL");
      const session = yield* Effect.tryPromise({
        try() {
          return stripe.checkout.sessions.create({
            line_items: items.map((item) => ({
              price_data: {
                currency: "usd",
                product_data: {
                  name: item.productDetails.name,
                  images: [item.productImage.imageUrl],
                },
                //accepts amount in cents
                unit_amount_decimal: String(+item.productDetails.price * 100),
              },
              quantity: item.quantity,
            })),
            mode: "payment",
            success_url: SUCCESS_URL,
            metadata: meta,
          });
        },
        catch(error) {
          return new ExpectedError(
            "An error occurred: cannot create checkout session",
          );
        },
      });
      return session;
    });
  };

  constructWebhookEvent = (body: string, sig: string) => {
    const stripe = this.stripe;
    return Effect.gen(function* (_) {
      const webhook_secret = yield* Config.string("STRIPE_WEBHOOK_KEY");
      const event = yield* Effect.try({
        try() {
          return stripe.webhooks.constructEvent(body, sig, webhook_secret);
        },
        catch(error) {
          return new ExpectedError(`Webhook error: ${error}`);
        },
      });

      return event;
    });
  };
}

/** @deprecated use CheckoutManager instead **/
export class PaymentService extends Context.Tag("PaymentService")<
  PaymentService,
  IPaymentService
>() {}

/** @deprecated use CheckoutManager instead **/
export const PaymentServiceLayer = {
  Tag: PaymentService,
  Repo: {
    Live: Layer.succeed(PaymentService, new StripePayment(new Stripe(""))),
  },
};
