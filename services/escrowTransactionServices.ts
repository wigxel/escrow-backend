import { Effect } from "effect";
import type { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import type {
  confirmEscrowRequestRules,
  createEscrowTransactionRules,
  escrowStatusRules,
} from "~/validationRules/escrowTransactions.rules";
import {
  participantStatus,
  sessionUser,
  type TEscrowRequest,
  type TUser,
} from "~/migrations/schema";
import { UserRepoLayer } from "~/repositories/user.repository";
import { EscrowRequestRepoLayer } from "~/repositories/escrow/escrowRequest.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/escrow/escrowParticipant.repo";
import { EscrowPaymentRepoLayer } from "~/repositories/escrow/escrowPayment.repo";
import { addHours, isBefore } from "date-fns";
import { ExpectedError } from "~/config/exceptions";
import { NoSuchElementException } from "effect/Cause";
import { head } from "effect/Array";
import { CheckoutManager } from "~/layers/payment/checkout-manager";
import { findOrCreateUser } from "./user.service";
import type {
  TPaymentDetails,
  TSuccessPaymentMetaData,
} from "./payment.service";
import {
  canTransitionEscrowStatus,
  getBuyerAndSellerFromParticipants,
} from "~/utils/escrow.utils";
import { id } from "tigerbeetle-node";

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
    const newAccountId = id()

    const customer: TUser = yield* _(
      userRepo.firstOrThrow({
        username: input.customerUsername,
      }),
      Effect.match({ onSuccess: (v) => v, onFailure: () => null }),
    );

    if (customer && customer.id === currentUser.id) {
      yield* new ExpectedError("You cannot create transaction with yourself");
    }

    //new escrow transaction
    const escrowTransaction = yield* _(
      escrowTransactionRepo.create({
        title: input.title,
        description: input.description,
        createdBy: currentUser.id,
      }),
      Effect.flatMap(head),
    );

    //create the escrow Wallet for the escrow transaction

    // create an account in tigerbeetle to track the escrow wallet transaction

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

    const escrowReqData: TEscrowRequest = {
      escrowId: escrowTransaction.id,
      senderId: currentUser.id,
      amount: String(input.amount),
      customerRole: input.creatorRole === "seller" ? "buyer" : "seller",
      customerUsername: input.customerUsername,
      customerEmail: input.customerEmail,
      customerPhone: String(input.customerPhone),
      expires_at: addHours(new Date(), 1),
    };

    yield* escrowRequestRepo.create(escrowReqData);
    return { escrowTransactionId: escrowTransaction.id };
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

    return {
      requestDetails: escrowRequestDetails,
      isAuthenticated: !!data.currentUser,
    };
  });
};

export const initializeEscrowDeposit = (
  input: z.infer<typeof confirmEscrowRequestRules> & { escrowId: string },
  currentUser: SessionUser,
) => {
  return Effect.gen(function* (_) {
    const escrowRequestRepo = yield* _(EscrowRequestRepoLayer.tag);
    const checkoutManager = yield* _(CheckoutManager);
    const escrowTransactionRepo = yield* _(EscrowTransactionRepoLayer.tag);

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
    if (isBefore(escrowRequestDetails.expires_at, new Date())) {
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

    //create a new account if neccessary
    const customerDetails = yield* _(findOrCreateUser(input));

    /**
     * the escrow request creator shouldn't be able to proceed with the escrow
     */
    if (currentUser && currentUser.id === escrowRequestDetails.senderId) {
      yield* new ExpectedError("Account associated with the escrow creation");
    }

    const checkoutSession = yield* checkoutManager.createSession({
      amount: String(Number(escrowRequestDetails.amount) * 100),
      email: input.customerEmail,
      reference: escrowRequestDetails.escrowId,
      callback_url: "",
      metadata: {
        customerDetails: {
          userId: customerDetails.id,
          email: input.customerEmail,
          username: input.customerUsername,
          phone: input.customerPhone,
          role: escrowRequestDetails.customerRole,
        },
        escrowId: escrowRequestDetails.escrowId,
      },
    });

    // update the escrow request with the access code so one can resume payment session
    yield* escrowRequestRepo.update(
      { escrowId: escrowRequestDetails.escrowId },
      {
        accessCode: checkoutSession.data.access_code,
        authorizationUrl: checkoutSession.data.authorization_url,
      },
    );

    return checkoutSession;
  });
};

/**
 * Handles the necessary updates and actions after a successful deposit.
 */
export const updateEscrowStatus = (
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
        //fees can be calculated and update here
      },
    );

    //update the esrow transaction to deposit.success
    yield* escrowTransactionRepo.update(
      { id: params.escrowId },
      { status: "deposit.success" },
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
            "invalid escrow id: no escrow transaction found",
          ),
      ),
    );
    return escrowDetails;
  });
};

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
  });
};

const validateUserStatusUpdate = (params: {
  escrowId: string;
  status: string;
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const escrowParticipantRepo = yield* _(EscrowParticipantRepoLayer.tag);
    
    const partcipants = yield* escrowParticipantRepo.getParticipants(
      params.escrowId,
    );

    const { seller, buyer } =
      yield* getBuyerAndSellerFromParticipants(partcipants);

    /**
     * only the service provider should be able to make this update
     */
    if (
      params.status === "service.pending" &&
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
      params.status === "service.confirmed" &&
      params.currentUser.id !== buyer.userId
    ) {
      yield* new ExpectedError(
        "Unauthorized operation: service consumer operation",
      );
    }
  });
};
