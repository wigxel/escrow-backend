import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import {
  type IPaymentService,
  PaymentService,
} from "~/services/stripe.service";
import { extendMockImplementation } from "./helpers";

class PaymentServiceMock implements IPaymentService {
  createCheckoutSession = (arg1, meta) => {
    return Effect.sync(() => {
      return {
        id: "session-id",
        url: "url",
      } as Stripe.Response<Stripe.Checkout.Session>;
    });
  };

  constructWebhookEvent = (body: string, sig: string) => {
    return Effect.sync(() => {
      return {
        data: {
          object: {
            metadata: {
              userId: "test-id",
              csID: "cs-id",
              packages: JSON.stringify([
                {
                  sellerId: "seller-id",
                  locationId: "MOCK_LOCATION_ID",
                  deliveryType: "pickup",
                },
              ]),
            },
            amount_total: 200,
          },
        },
        type: "checkout.session.completed",
      } as unknown as Stripe.Event;
    });
  };
}

export const extendPaymentService = extendMockImplementation(
  PaymentService,
  () => new PaymentServiceMock(),
);

export const PaymentServiceTest = Layer.succeed(
  PaymentService,
  new PaymentServiceMock(),
);
