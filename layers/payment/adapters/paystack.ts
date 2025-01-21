import { Paystack } from "~/utils/paystack/paystack";
import { CheckoutManager, type TCheckoutManager } from "../checkout-manager";
import type { TInitializeTransactionData } from "~/utils/paystack/type/data";
import { Config, Effect, Layer, pipe, Redacted } from "effect";
import { PaystackEventLive } from "./paystack-events";

class PaystackCheckout implements TCheckoutManager {
  provider = "Paystack";

  constructor(private paystack: Paystack) {}

  createSession(params: TInitializeTransactionData) {
    return Effect.tryPromise(() => {
      return this.paystack.initializeTransaction(params);
    });
  }

  verifyPayment(params: unknown){
    return Effect.succeed(1)
  }

  verifyWebhook(payload:Record<string,unknown>,signature:string){
    return Effect.sync(()=>{
      if(this.paystack.verifyWebhookSignature(payload,signature)) return true;
      return false;
    })
  }
}

export const PaystackCheckoutLive = pipe(
  Config.redacted("PSK_PUBLIC_KEY"),
  Effect.map((redacted_secret) => {
    const paystack = new Paystack(Redacted.value(redacted_secret));

    return Layer.effect(
      CheckoutManager,
      pipe(
        Effect.suspend(() => Effect.succeed(new PaystackCheckout(paystack))),
        Effect.provide(PaystackEventLive),
      ),
    );
  }),
  Layer.unwrapScoped,
);
