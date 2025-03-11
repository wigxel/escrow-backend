import { Effect } from "effect";
import type { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";
import {
  EscrowTransactionRepo,
  EscrowTransactionRepoLayer,
} from "~/repositories/escrow/escrowTransaction.repo";
import type {
  confirmEscrowRequestRules,
  createEscrowTransactionRules,
  escrowStatusRules,
  TEscrowTransactionFilter,
} from "~/dto/escrowTransactions.dto";
import type { TEscrowRequest, TUser } from "~/migrations/schema";
import { UserRepoLayer } from "~/repositories/user.repository";
import { EscrowRequestRepoLayer } from "~/repositories/escrow/escrowRequest.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/escrow/escrowParticipant.repo";
import { EscrowPaymentRepoLayer } from "~/repositories/escrow/escrowPayment.repo";
import { addHours, isBefore } from "date-fns";
import { ExpectedError } from "~/config/exceptions";
import { NoSuchElementException } from "effect/Cause";
import { head } from "effect/Array";
import { PaymentGateway } from "~/layers/payment/payment-gateway";
import { handleUserCreationFromEscrow } from "../user.service";
import {
  canTransitionEscrowStatus,
  convertCurrencyUnit,
  getBuyerAndSellerFromParticipants,
} from "~/services/escrow/escrow.utils";
import { id } from "tigerbeetle-node";
import { EscrowWalletRepoLayer } from "~/repositories/escrow/escrowWallet.repo";
import {
  createAccount as createTBAccount,
  getAccountBalance,
} from "../tigerbeetle.service";
import { TBAccountCode } from "~/utils/tigerBeetle/type/type";
import type { TPaymentDetails, TSuccessPaymentMetaData } from "~/types/types";
import { createActivityLog } from "../activityLog/activityLog.service";
import { escrowActivityLog } from "../activityLog/concreteEntityLogs/escrow.activitylog";
import { dataResponse } from "~/libs/response";
import { searchRepo } from "../search";
import { PaginationService } from "../search/pagination.service";
import { SearchOps } from "../search/sql-search-resolver";

export const createEscrowTransaction = (
  input: z.infer<typeof createEscrowTransactionRules>,
  currentUser: SessionUser,
) => {
  return Effect.gen(function* (_) {
    const escrowTransactionRepo = yield* _(EscrowTransactionRepoLayer.tag);
    const escrowParticipantRepo = yield* _(EscrowParticipantRepoLayer.tag);
    const escrowRequestRepo = yield* _(EscrowRequestRepoLayer.tag);
    const escrowPaymentRepo = yield* _(EscrowPaymentRepoLayer.tag);
    const userRepo = yield* _(UserRepoLayer.Tag);
    const escrowWalletRepo = yield* _(EscrowWalletRepoLayer.tag);
    // generate unique bigint id for tigerbeetle_account_id
    const tbAccountId = String(id());

    /**
     * the user the escrow is created for
     */
    const customer: TUser = yield* _(
      userRepo.firstOrThrow({
        username: input.customerUsername,
      }),
      Effect.match({ onSuccess: (v) => v, onFailure: () => null }),
    );

    if (customer && customer.id === currentUser.id) {
      yield* new ExpectedError("You cannot create transaction with yourself");
    }

    // new escrow transaction
    const escrowTransaction = yield* _(
      escrowTransactionRepo.create({
        title: input.title,
        description: input.description,
        createdBy: currentUser.id,
      }),
      Effect.flatMap(head),
    );

    /**
     * create the escrow Wallet for the escrow transaction
     * create an account in tigerbeetle to track the escrow wallet transaction
     */
    yield* _(
      Effect.all([
        escrowWalletRepo.create({
          escrowId: escrowTransaction.id,
          tigerbeetleAccountId: String(tbAccountId),
        }),

        createTBAccount({
          accountId: tbAccountId,
          code: TBAccountCode.ESCROW_WALLET,
          ledger: "ngnLedger",
        }),
      ]),
    );

    //add the creator to the participant table
    yield* escrowParticipantRepo.create({
      escrowId: escrowTransaction.id,
      userId: currentUser.id,
      role: input.creatorRole,
    });

    //escrow payment
    yield* escrowPaymentRepo.create({
      escrowId: escrowTransaction.id,
      amount: String(input.amount),
    });

    const escrowRequestData: TEscrowRequest = {
      escrowId: escrowTransaction.id,
      senderId: currentUser.id,
      amount: String(input.amount),
      customerRole: input.creatorRole === "seller" ? "buyer" : "seller",
      customerUsername: input.customerUsername,
      customerEmail: input.customerEmail,
      customerPhone: String(input.customerPhone),
      expiresAt: addHours(new Date(), 1),
    };

    yield* escrowRequestRepo.create(escrowRequestData);
    //log the escrow creation
    yield* createActivityLog(
      escrowActivityLog.created({ id: escrowTransaction.id }),
    );
    return dataResponse({
      data: { escrowTransactionId: escrowTransaction.id },
    });
  });
};

export const listUserEscrowTransactions = (
  filters: TEscrowTransactionFilter,
  user_id: string,
) => {
  return Effect.gen(function* (_) {
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;

    return dataResponse(
      yield* searchRepo(
        escrowRepo.with("escrowWalletDetails").with("paymentDetails"),
        () => ({
          where: SearchOps.and(
            filters.status
              ? SearchOps.eq("status", filters.status)
              : SearchOps.none(),
            SearchOps.eq("createdBy", user_id),
          ),
        }),
      ),
    );
  });
};

export const getEscrowTransactionDetails = (params: {
  escrowId: string;
}) => {
  return Effect.gen(function* (_) {
    const escrowRepo = yield* _(EscrowTransactionRepoLayer.tag);
    const escrowDetails = yield* _(
      escrowRepo.getEscrowDetails(params.escrowId),
      Effect.mapError(
        () =>
          new NoSuchElementException(
            "Invalid escrow id: no escrow transaction found",
          ),
      ),
    );

    const balance = yield* getAccountBalance(
      escrowDetails.escrowWalletDetails.tigerbeetleAccountId,
    );

    return dataResponse({
      data: {
        ...escrowDetails,
        escrowWalletDetails: {
          ...escrowDetails.escrowWalletDetails,
          balance: convertCurrencyUnit(String(balance), "kobo-naira"),
        },
      },
    });
  });
};

export const getEscrowRequestDetails = (data: {
  escrowId: string;
  currentUser: SessionUser | null;
}) => {
  return Effect.gen(function* (_) {
    const escrowRequestRepo = yield* _(EscrowRequestRepoLayer.tag);
    const escrowTransactionRepo = yield* _(EscrowTransactionRepoLayer.tag);

    const escrowRequestDetails = yield* _(
      escrowRequestRepo.firstOrThrow({
        escrowId: data.escrowId,
        status: "pending",
      }),
      Effect.mapError(() => new NoSuchElementException("Invalid escrow id")),
    );

    //update the escrow transaction status to "deposit.pending"
    yield* escrowTransactionRepo.update(
      { id: escrowRequestDetails.escrowId },
      { status: "deposit.pending" },
    );

    //log the escrow creation
    yield* createActivityLog(
      escrowActivityLog.depositPending({ id: escrowRequestDetails.escrowId }),
    );

    return {
      data: {
        requestDetails: escrowRequestDetails,
        isAuthenticated: !!data.currentUser,
      },
    };
  });
};

export const initializeEscrowDeposit = (
  input: z.infer<typeof confirmEscrowRequestRules> & { escrowId: string },
  currentUser: SessionUser,
) => {
  return Effect.gen(function* (_) {
    const escrowRequestRepo = yield* _(EscrowRequestRepoLayer.tag);
    const paymentGateway = yield* _(PaymentGateway);
    const escrowTransactionRepo = yield* _(EscrowTransactionRepoLayer.tag);
    const userRepo = UserRepoLayer.Tag;

    let customerDetails: TUser | SessionUser;
    if (currentUser) {
      customerDetails = currentUser;
    } else {
      //create a new account if neccessary
      customerDetails = yield* userRepo.pipe(
        Effect.flatMap((repo) =>
          Effect.matchEffect(
            repo.firstOrThrow({ username: input.customerUsername }),
            {
              onSuccess: () =>
                new ExpectedError("Unauthorized: signin to continue"),
              onFailure: (e) => handleUserCreationFromEscrow(input),
            },
          ),
        ),
      );
    }

    const escrowTransactionDetails = yield* _(
      escrowTransactionRepo.firstOrThrow({ id: input.escrowId }),
      Effect.mapError(
        () => new NoSuchElementException("Invalid escrow transaction id"),
      ),
    );

    if (escrowTransactionDetails.status !== "deposit.pending") {
      yield* new ExpectedError(
        "Please click the link sent to you to proceed with payment",
      );
    }

    const escrowRequestDetails = yield* _(
      escrowRequestRepo.firstOrThrow({
        escrowId: input.escrowId,
        status: "pending",
      }),
      Effect.mapError(() => new NoSuchElementException("Invalid escrow id")),
    );

    //make sure the escrow transaction hasn't expired
    if (isBefore(escrowRequestDetails.expiresAt, new Date())) {
      yield* new ExpectedError("Escrow transaction request has expired");
    }

    if (escrowRequestDetails.accessCode) {
      return {
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: escrowRequestDetails.authorizationUrl,
          access_code: escrowRequestDetails.accessCode,
          reference: escrowRequestDetails.escrowId,
        },
      };
    }

    /**
     * the escrow request creator shouldn't be able to proceed with the escrow
     */
    if (currentUser && currentUser.id === escrowRequestDetails.senderId) {
      yield* new ExpectedError("Account associated with the escrow creation");
    }

    const checkoutSession = yield* paymentGateway.createSession({
      //convert to smallest currency unit kobo
      amount: String(
        convertCurrencyUnit(escrowRequestDetails.amount, "naira-kobo"),
      ),
      email: customerDetails.email,
      reference: escrowRequestDetails.escrowId,
      callback_url: "",
      metadata: {
        customerDetails: {
          userId: customerDetails.id,
          email: customerDetails.email,
          username: customerDetails.username,
          phone: customerDetails.phone,
          role: escrowRequestDetails.customerRole,
        },
        escrowId: escrowRequestDetails.escrowId,
        relatedUserId: escrowRequestDetails.senderId,
      },
    });

    // update the escrow request with the access code so one can resume payment session
    yield* escrowRequestRepo.update(
      { escrowId: escrowRequestDetails.escrowId },
      {
        customerEmail: customerDetails.email,
        customerUsername: customerDetails.username,
        customerPhone: customerDetails.phone,
        accessCode: checkoutSession.data.access_code,
        authorizationUrl: checkoutSession.data.authorization_url,
      },
    );

    return dataResponse({
      data: checkoutSession.data,
      status: checkoutSession.status,
      message: checkoutSession.message,
    });
  });
};

/**
 * Handles the necessary updates and actions after a successful deposit.
 */
export const finalizeEscrowTransaction = (
  params: TSuccessPaymentMetaData & { paymentDetails: TPaymentDetails },
) => {
  return Effect.gen(function* (_) {
    const escrowTransactionRepo = yield* EscrowTransactionRepoLayer.tag;
    const escrowParticipantRepo = yield* EscrowParticipantRepoLayer.tag;
    const escrowRequestRepo = yield* EscrowRequestRepoLayer.tag;
    const escrowPaymentRepo = yield* EscrowPaymentRepoLayer.tag;

    //update the escrowRequest status to accepted otherwise it can be deleted
    yield* _(
      escrowRequestRepo.update(
        { escrowId: params.escrowId },
        { status: "accepted" },
      ),
    );

    //add the customer as participant
    yield* escrowParticipantRepo.create({
      escrowId: params.escrowId,
      role: params.customerDetails.role,
      userId: params.customerDetails.userId,
    });

    //update the payment table
    yield* escrowPaymentRepo.update(
      { escrowId: params.escrowId },
      {
        status: params.paymentDetails.status,
        userId: params.customerDetails.userId,
        method: params.paymentDetails.paymentMethod,
        //fees can be calculated and updated here
      },
    );

    //update the esrow transaction to deposit.success
    yield* escrowTransactionRepo.update(
      { id: params.escrowId },
      { status: "deposit.success" },
    );

    //log the escrow creation
    yield* createActivityLog(
      escrowActivityLog.depositSuccess({ id: params.escrowId }),
    );
  });
};

/**
 * handles updating the escrow status based on the stages of the transaction
 * between vendor and customer
 */
export const updateEscrowTransactionStatus = (params: {
  escrowId: string;
  status: z.infer<typeof escrowStatusRules>["status"];
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const escrowRepo = yield* _(EscrowTransactionRepoLayer.tag);

    const escrowDetails = yield* _(
      escrowRepo.firstOrThrow({ id: params.escrowId }),
      Effect.mapError(
        () =>
          new NoSuchElementException(
            "invalid escrow id: no escrow transaction found",
          ),
      ),
    );

    if (!canTransitionEscrowStatus(escrowDetails.status, params.status)) {
      yield* new ExpectedError(
        `Cannot transition from ${escrowDetails.status} to ${params.status}`,
      );
    }

    // makes certain the expected user is making the update
    yield* validateUserStatusUpdate({
      escrowId: escrowDetails.id,
      status: params.status,
      currentUser: params.currentUser,
    });

    yield* escrowRepo.update(
      { id: params.escrowId },
      { status: params.status },
    );

    yield* createActivityLog(
      escrowActivityLog.statusFactory(params.status)({ id: params.escrowId }),
    );

    return dataResponse({
      message: `Status updated from ${escrowDetails.status} to ${params.status} successfully`,
    });
  });
};

export const validateUserStatusUpdate = (params: {
  escrowId: string;
  status: string;
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const escrowParticipantRepo = yield* _(EscrowParticipantRepoLayer.tag);
    const sellerStatus = ["service.pending"];
    const buyerStatus = ["service.confirmed", "completed"];

    const partcipants = yield* escrowParticipantRepo.getParticipants(
      params.escrowId,
    );

    const { seller, buyer } =
      yield* getBuyerAndSellerFromParticipants(partcipants);

    /**
     * only the service provider should be able to make this update
     */
    if (
      sellerStatus.includes(params.status) &&
      params.currentUser.id !== seller.userId
    ) {
      yield* new ExpectedError(
        "Unauthorized operation: service provider operation",
      );
    }

    /**
     * only the service consumer should be able to make this update
     */
    if (
      buyerStatus.includes(params.status) &&
      params.currentUser.id !== buyer.userId
    ) {
      yield* new ExpectedError(
        "Unauthorized operation: service consumer operation",
      );
    }

    return { seller, buyer };
  });
};
