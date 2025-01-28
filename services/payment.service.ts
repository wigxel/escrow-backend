import { Config, Effect } from "effect";
import { CheckoutManager } from "~/layers/payment/checkout-manager";
import {
  PaymentEvent,
  PaymentEventService,
} from "~/layers/payment/payment-events";
import { updateEscrowStatus } from "./escrowTransactionServices";
import { ExpectedError } from "~/config/exceptions";
import { EscrowWalletRepoLayer } from "~/repositories/escrow/escrowWallet.repo";
import { createTransfer as createTBTransfer } from "./tigerbeetle.service";
import { id } from "tigerbeetle-node";
import { AccountStatementRepoLayer } from "~/repositories/accountStatement.repo";
import { TBTransferReason } from "~/utils/tigerBeetle/type/type";

export const handlePaymentEvents = (
  res: TPaystackPaymentEventResponse,
  paystackSignature: string,
) => {
  return Effect.gen(function* (_) {
    const manager = yield* CheckoutManager;
    const paymentEvents = yield* PaymentEventService;
    const escrowWalletRepo = yield* EscrowWalletRepoLayer.tag;
    const accountStatementRepo = yield* AccountStatementRepoLayer.tag;

    const isVerifiedWebhook = yield* manager.verifyWebhook(
      res,
      paystackSignature,
    );
    if (!isVerifiedWebhook) {
      yield* new ExpectedError("Signature mismatch: Invalid signature.");
    }
    const event = paymentEvents.resolve(res);

    const metadata =
      yield* paymentEvents.getMetadata<TSuccessPaymentMetaData>(event);

    if (PaymentEvent.$is("Chargefailed")(event)) {
      // do something when the payment fails
      yield* Effect.logDebug("Failed payment event");
    }

    if (!PaymentEvent.$is("ChargeSuccess")(event)) {
      yield* Effect.logDebug("Payment failed: Ignoring payment event");
      return;
    }

    yield* Effect.logDebug(`Payment successful for (${res?.data.reference})`);

    const escrowWallet = yield* _(
      escrowWalletRepo.firstOrThrow({ escrowId: metadata.escrowId }),
      Effect.mapError(
        () => new ExpectedError("Invalid escrow id: wallet not found"),
      ),
    );

    //credit the escrow wallet in tigerbeetle database
    const transactionId = String(id());
    yield* _(
      Config.string("ORG_ACCOUNT_ID").pipe(
        Effect.flatMap((accountId) =>
          createTBTransfer({
            transferId: transactionId,
            credit_account_id: escrowWallet.tigerbeetleAccountId,
            debit_account_id: accountId,
            //note amount is in smallet currency unit eg Kobo
            amount: Number(res.data.amount),
            code: TBTransferReason.ESCROW_PAYMENT,
            ledger: "ngnLedger",
          }),
        ),
      ),
    );

    //add transaction statement entry;
    yield* accountStatementRepo.create({
      //convert from kobo to naira
      amount: String(+res.data.amount / 100),
      type: "escrow.deposit",
      creatorId: metadata.customerDetails.userId,
      tigerbeetleAccountId: transactionId,
      relatedUserId: metadata.relatedUserId,
      metadata: JSON.stringify({
        escrowId: metadata.escrowId,
        from: "organization",
        to: "escrow wallet",
        description: "payment into escrow wallet",
      }),
    });

    yield* updateEscrowStatus({
      escrowId: metadata.escrowId,
      customerDetails: metadata.customerDetails,
      paymentDetails: {
        amount: Number(res.data.amount),
        status: res.data.status,
        paymentMethod: res.data.channel,
      },
      relatedUserId: metadata.relatedUserId,
    });

    //TODO: in-app notification or email for successful payment
  });
};

export type TSuccessPaymentMetaData = {
  escrowId: string;
  customerDetails: {
    userId: string;
    email: string;
    username: string;
    role: "buyer" | "seller";
  };
  relatedUserId: string;
};

export type TPaymentDetails = {
  amount: number;
  status: string;
  paymentMethod: string;
};

export type TPaystackPaymentEventResponse = {
  event: string;
  data: {
    amount: string;
    reference: string;
    status: string;
    channel: string;
    metadata: TSuccessPaymentMetaData;
  };
};
