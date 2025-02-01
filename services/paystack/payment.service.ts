import { Config, Effect } from "effect";
import {
  updateEscrowStatus,
  validateUserStatusUpdate,
} from "../escrow/escrowTransactionServices";
import {
  ExpectedError,
  InsufficientBalanceException,
} from "~/config/exceptions";
import { EscrowWalletRepoLayer } from "~/repositories/escrow/escrowWallet.repo";
import {
  createTransfer as createTBTransfer,
  getAccountBalance,
} from "../tigerbeetle.service";
import { id, TransferFlags } from "tigerbeetle-node";
import { AccountStatementRepoLayer } from "~/repositories/accountStatement.repo";
import { TBTransferCode } from "~/utils/tigerBeetle/type/type";
import { TigerBeetleRepoLayer } from "~/repositories/tigerbeetle/tigerbeetle.repo";
import { UserWalletRepoLayer } from "~/repositories/userWallet.repo";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { NoSuchElementException } from "effect/Cause";
import type { SessionUser } from "~/layers/session-provider";
import { convertCurrencyUnit } from "~/services/escrow/escrow.utils";
import type {
  TSuccessPaymentMetaData,
} from "~/types/types";
import { WithdrawalRepoLayer } from "~/repositories/withdrawal.repo";
import { PaymentGateway } from "~/layers/payment/payment-gateway";
import { BankAccountRepoLayer } from "~/repositories/accountNumber.repo";
import type { z } from "zod";
import type { withdrawalRules } from "~/dto/withdrawal.dto";
import { randomUUID } from "uncrypto";
import type { TPaystackPaymentWebhookEvent } from "~/utils/paystack/type/types";

export const handleSuccessPaymentEvents = (res: TPaystackPaymentWebhookEvent) => {
  return Effect.gen(function* (_) {
    const escrowWalletRepo = yield* EscrowWalletRepoLayer.tag;
    const accountStatementRepo = yield* AccountStatementRepoLayer.tag;
    const metadata = res.data.metadata as TSuccessPaymentMetaData

    const escrowWallet = yield* _(
      escrowWalletRepo.firstOrThrow({ escrowId: metadata.escrowId }),
      Effect.mapError(
        () => new ExpectedError("Invalid escrow id: wallet not found"),
      ),
    );

    //credit the escrow wallet in tigerbeetle database
    const transactionId = String(id());
    const orgAccountId = yield* Config.string("ORG_ACCOUNT_ID");
    yield* _(
      createTBTransfer({
        transferId: transactionId,
        credit_account_id: escrowWallet.tigerbeetleAccountId,
        debit_account_id: orgAccountId,
        //note amount is in smallet currency unit eg Kobo set by paystack data
        amount: Number(res.data.amount),
        code: TBTransferCode.ESCROW_PAYMENT,
        ledger: "ngnLedger",
      }),
    );

    //add transaction statement entry;
    yield* accountStatementRepo.create({
      //convert from kobo to naira
      amount: String(convertCurrencyUnit(res.data.amount, "kobo-naira")),
      type: "escrow.deposit",
      creatorId: metadata.customerDetails.userId,
      tigerbeetleTransferId: transactionId,
      relatedUserId: metadata.relatedUserId,
      metadata: JSON.stringify({
        escrowId: metadata.escrowId,
        from: { accountId: orgAccountId, name: "organization wallet" },
        to: {
          accountId: escrowWallet.tigerbeetleAccountId,
          name: "escrow wallet",
        },
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

export const releaseFunds = (params: {
  escrowId: string;
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const userWalletRepo = yield* UserWalletRepoLayer.tag;
    const accountStatementRepo = yield* AccountStatementRepoLayer.tag;
    const tigerBeetleRepo = yield* TigerBeetleRepoLayer.Tag;

    const escrowDetails = yield* _(
      escrowRepo.getEscrowDetails(params.escrowId),
      Effect.mapError(
        () => new NoSuchElementException("Invalid escrow transaction id"),
      ),
    );

    if (escrowDetails.status === "completed") {
      yield* new ExpectedError("This transaction has already been completed.");
    }

    if (!canTransitionEscrowStatus(escrowDetails.status, "completed")) {
      yield* new ExpectedError(
        `Cannot transition from ${escrowDetails.status} to completed`,
      );
    }

    /**
     * this makes sure the buyer is the one releasing the funds
     */
    const { seller: recipient, buyer } = yield* validateUserStatusUpdate({
      escrowId: params.escrowId,
      currentUser: params.currentUser,
      status: "completed",
    });

    //get the recipient wallet
    const recipientWallet = yield* _(
      userWalletRepo.firstOrThrow({ userId: recipient.userId }),
      Effect.mapError(
        () =>
          new NoSuchElementException("Invalid user id: user wallet not found"),
      ),
    );
    // generate a transfer id
    const transferId = String(id());
    // upon release of funds move the money from the escrow wallet
    // to the recipient wallet
    yield* _(
      Effect.all([
        tigerBeetleRepo.createTransfers({
          transferId,
          amount: convertCurrencyUnit(
            escrowDetails.paymentDetails.amount,
            "naira-kobo",
          ),
          debit_account_id:
            escrowDetails.escrowWalletDetails.tigerbeetleAccountId,
          credit_account_id: recipientWallet.tigerbeetleAccountId,
        }),

        accountStatementRepo.create({
          amount: escrowDetails.paymentDetails.amount,
          creatorId: params.currentUser.id,
          relatedUserId: recipient.userId,
          type: "wallet.deposit",
          tigerbeetleTransferId: transferId,
          metadata: JSON.stringify({
            escrowId: escrowDetails.id,
            from: {
              accountId: escrowDetails.escrowWalletDetails.tigerbeetleAccountId,
              name: "escrow wallet",
            },
            to: {
              accountId: recipientWallet.tigerbeetleAccountId,
              name: "user wallet",
            },
            description: "Release of funds from escrow to user wallet",
          }),
        }),
      ]),
    );

    //mark the escrow transaction as completed
    yield* escrowRepo.update({ id: escrowDetails.id }, { status: "completed" });
  });
};

export const withdrawFromWallet = (
  params: z.infer<typeof withdrawalRules> & {
    currentUser: SessionUser;
  },
) => {
  return Effect.gen(function* (_) {
    const withdrawalRepo = yield* _(WithdrawalRepoLayer.tag);
    const tigerBeetleRepo = yield* TigerBeetleRepoLayer.Tag;
    const userWalletRepo = yield* UserWalletRepoLayer.tag;
    const paystack = yield* PaymentGateway;
    const bankAccountRepo = yield* BankAccountRepoLayer.tag;
    const accountStatementRepo = yield* AccountStatementRepoLayer.tag;
    
    const bankAccountDetails = yield* _(
      bankAccountRepo.firstOrThrow({ id: params.accountNumberId }),
      Effect.mapError(
        () => new NoSuchElementException("Invalid account number id"),
      ),
    );

    const wallet = yield* _(
      userWalletRepo.firstOrThrow({ userId: params.currentUser.id }),
      Effect.mapError(() => new NoSuchElementException("wallet not found")),
    );

    const amount = convertCurrencyUnit(params.amount, "naira-kobo");
    const accountBalance = yield* getAccountBalance(wallet.tigerbeetleAccountId);
   
    if (Number(accountBalance) < amount) {
      yield* new InsufficientBalanceException();
    }

    const currentBalance = convertCurrencyUnit(Number(accountBalance) - amount,"kobo-naira")
    const referenceCode = randomUUID();
    const tigerbeetleTransferId = String(id());

    /**
     * initiates a transfer from paystack account to users bank account
     */
    const transferResponse = yield* _(
      paystack.initiateTransfer({
        amount,
        recipientCode: bankAccountDetails.paystackRecipientCode,
        referenceCode,
      }),
      Effect.mapError(() => new ExpectedError("Unable to initiate transfer")),
    );

    yield* _(
      Effect.all([
        withdrawalRepo.create({
          amount: String(params.amount),
          referenceCode,
          userId: params.currentUser.id,
          status: transferResponse.data.status,
          tigerbeetleTransferId,
        }),

        tigerBeetleRepo.createTransfers({
          amount,
          credit_account_id: bankAccountDetails.tigerbeetleAccountId,
          debit_account_id: wallet.tigerbeetleAccountId,
          transferId: tigerbeetleTransferId,
          code: TBTransferCode.WALLET_WITHDRAWAL,
          flags: TransferFlags.pending,
        }),
      ]),
    );

    //add statement
    yield* accountStatementRepo.create({
      amount: String(params.amount),
      balance:String(currentBalance),
      type: "wallet.withdraw",
      creatorId: params.currentUser.id,
      tigerbeetleTransferId: tigerbeetleTransferId,
      status:"pending",
      metadata: JSON.stringify({
        escrowId:null,
        from: { accountId: wallet.tigerbeetleAccountId, name: "user wallet" },
        to: {
          accountId: bankAccountDetails.id,
          name: "user bank account",
        },
        description: `withdrawing N${params.amount} from wallet to bank account`,
      }),
    });

  });
};
