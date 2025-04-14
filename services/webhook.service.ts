import { Effect } from "effect";
import { ExpectedError } from "~/config/exceptions";
import {
  PaymentGatewayEvent,
  PaymentGatewayEventService,
} from "~/layers/payment/payment-events";
import { PaymentGateway } from "~/layers/payment/payment-gateway";
import type {
  TPaystackPaymentWebhookEvent,
  TPaystackTransferWebhookEvent,
  TPaystackWebookEvent,
} from "~/utils/paystack/type/types";
import { handleSuccessPaymentEvents } from "./paystack/payment.service";
import { WithdrawalRepoLayer } from "~/repositories/withdrawal.repo";
import { NoSuchElementException } from "effect/Cause";
import { TBTransferCode } from "~/layers/ledger/type";
import { id, TransferFlags } from "tigerbeetle-node";
import { AccountStatementRepoLayer } from "~/repositories/accountStatement.repo";
import { SearchOps } from "./search/sql-search-resolver";
import { createTransfer as createTBTransfer } from "./tigerbeetle.service";

export const handlePaystackWebhook = (
  res: TPaystackWebookEvent,
  paystackSignature: string,
) => {
  return Effect.gen(function* (_) {
    const paymentGateway = yield* PaymentGateway;
    const paystackEvents = yield* PaymentGatewayEventService;

    const isVerifiedWebhook = yield* paymentGateway.verifyWebhook(
      res,
      paystackSignature,
    );
    if (!isVerifiedWebhook) {
      yield* new ExpectedError("Signature mismatch: Invalid signature.");
    }

    const event = paystackEvents.resolve(res);

    if (PaymentGatewayEvent.$is("ChargeFailed")(event)) {
      // do something when the payment fails
      yield* Effect.logDebug("Failed payment event");
    }

    if (PaymentGatewayEvent.$is("ChargeSuccess")(event)) {
      yield* Effect.logDebug(`Payment successful for (${res?.data.reference})`);
      yield* handleSuccessPaymentEvents(res as TPaystackPaymentWebhookEvent);
      return;
    }

    if (PaymentGatewayEvent.$is("TransferSuccess")(event)) {
      yield* transferSuccessEvent(res as TPaystackTransferWebhookEvent);
    }

    if (PaymentGatewayEvent.$is("TransferFailed")(event)) {
      yield* unsuccessfulTransferEvent(res as TPaystackTransferWebhookEvent);
      //code specific to failed transaction
    }

    if (PaymentGatewayEvent.$is("TransferReversed")(event)) {
      yield* unsuccessfulTransferEvent(res as TPaystackTransferWebhookEvent);
      //code specific to reversed transactionn
    }
  });
};

export const transferSuccessEvent = (res: TPaystackTransferWebhookEvent) => {
  return Effect.gen(function* (_) {
    const withdrawalRepo = yield* _(WithdrawalRepoLayer.tag);
    const accountStatementRepo = yield* AccountStatementRepoLayer.tag;

    const withdrawalDetails = yield* _(
      withdrawalRepo.firstOrThrow({ referenceCode: res.data.reference }),
      Effect.mapError(
        () => new NoSuchElementException("Invalid withdrawal id"),
      ),
    );

    //update the withdrawal and tigerbeetle
    yield* _(
      Effect.all([
        withdrawalRepo.update(
          {
            id: withdrawalDetails.id,
          },
          { status: res.data.status },
        ),

        createTBTransfer({
          transferId: String(id()),
          pendingId: withdrawalDetails.tigerbeetleTransferId,
          credit_account_id: "0",
          debit_account_id: "0",
          amount: 0,
          code: TBTransferCode.WALLET_WITHDRAWAL,
          flags: TransferFlags.post_pending_transfer,
        }),
      ]),
    );

    //update statement
    yield* accountStatementRepo.update(
      { tigerbeetleTransferId: withdrawalDetails.tigerbeetleTransferId },
      { status: "completed" },
    );
  });
};

export const unsuccessfulTransferEvent = (
  res: TPaystackTransferWebhookEvent,
) => {
  return Effect.gen(function* (_) {
    const withdrawalRepo = yield* _(WithdrawalRepoLayer.tag);
    const accountStatementRepo = yield* AccountStatementRepoLayer.tag;

    const withdrawalDetails = yield* _(
      withdrawalRepo.firstOrThrow({
        referenceCode: res.data.reference,
      }),
      Effect.mapError(
        () => new NoSuchElementException("Invalid withdrawal id"),
      ),
    );

    yield* _(
      Effect.all([
        withdrawalRepo.update(
          { referenceCode: res.data.reference },
          {
            status: res.data.status,
          },
        ),

        createTBTransfer({
          amount: 0,
          credit_account_id: "0",
          debit_account_id: "0",
          transferId: withdrawalDetails.tigerbeetleTransferId,
          code: TBTransferCode.WALLET_WITHDRAWAL,
          flags: TransferFlags.void_pending_transfer,
        }),
      ]),
    );

    yield* accountStatementRepo.delete(
      SearchOps.eq(
        "tigerbeetleTransferId",
        withdrawalDetails.tigerbeetleTransferId,
      ),
    );
  });
};
