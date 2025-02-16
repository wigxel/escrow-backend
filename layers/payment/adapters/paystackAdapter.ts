import { Paystack } from "~/utils/paystack/paystack";
import { PaymentGateway, type TPaymentGateway } from "../payment-gateway";
import type { TCreateTransferRecipientData, TInitializeTransactionData, TInitiateTransferData } from "~/utils/paystack/type/data";
import { Config, Effect, Layer, pipe, Redacted } from "effect";
import { PaystackEventLive } from "./paystack-events";
import type { UnknownException } from "effect/Cause";

class PaystackGateway implements TPaymentGateway {
  provider = "Paystack";

  constructor(private paystack: Paystack) {}

  run<T>(
    fn: (gateway: Paystack) => Promise<T>,
  ): Effect.Effect<T, UnknownException> {
    return Effect.tryPromise(() => fn(this.paystack));
  }

  createSession(params: TInitializeTransactionData) {
    return Effect.tryPromise(() => {
      return this.paystack.initializeTransaction(params);
    });
  }

  verifyPayment(params: unknown) {
    return Effect.succeed(1);
  }

  verifyWebhook(payload: Record<string, unknown>, signature: string) {
    return Effect.sync(() => {
      if (this.paystack.verifyWebhookSignature(payload, signature)) return true;
      return false;
    });
  }

  bankLists(currency="NGN") {
    return this.run((gateway)=>{
      return gateway.listBanks(currency)
    })
  }

  resolveBankAccount(accountNumber:string,bankCode:string){
    return this.run((gateway)=>gateway.resolveAccountNumber(accountNumber,bankCode))
  }

  createTransferRecipient(payload:TCreateTransferRecipientData){
    return this.run((gateway)=>gateway.createTransferRecipient(payload))
  }

  initiateTransfer(payload:TInitiateTransferData){
    return this.run((gateway)=>gateway.initiateTransfer(payload))
  }

}

export const PaystackGatewayLive = pipe(
  Config.redacted("PSK_PUBLIC_KEY"),
  Effect.map((redacted_secret) => {
    const paystack = new Paystack(Redacted.value(redacted_secret));

    return Layer.effect(
      PaymentGateway,
      pipe(
        Effect.suspend(() => Effect.succeed(new PaystackGateway(paystack))),
        Effect.provide(PaystackEventLive),
      ),
    );
  }),
  Layer.unwrapScoped,
);
