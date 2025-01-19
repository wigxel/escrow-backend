import { Console, Effect } from "effect";
import type { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";

import { EscrowTransactionRepoLayer } from "~/repositories/transaction/escrowTransaction.repo";

import type {
  confirmEscrowRequestRules,
  createEscrowTransactionRules,
} from "~/validationRules/escrowTransactions.rules";
import type { TEscrowRequest, TUser } from "~/migrations/schema";
import {
  UserRepoLayer,
  type UserRepository,
} from "~/repositories/user.repository";
import { EscrowRequestRepoLayer } from "~/repositories/transaction/escrowRequest.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/transaction/escrowParticipant.repo";
import { EscrowPaymentRepoLayer } from "~/repositories/transaction/escrowPayment.repo";
import { addHours, isBefore } from "date-fns";
import { ExpectedError } from "~/config/exceptions";
import { NoSuchElementException } from "effect/Cause";
import { Mail } from "~/layers/mailing/mail";
import { head } from "effect/Array";
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

    let customer: TUser;
    if (input.customerUsername) {
      customer = yield* userRepo.firstOrThrow({
        username: input.customerUsername,
      });

      if (customer.id === currentUser.id) {
        yield* new ExpectedError("You cannot create transaction with yourself");
      }
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

    let escrowReqData: TEscrowRequest = {
      escrowId: escrowTransaction.id,
      senderId: currentUser.id,
      customerRole: input.creatorRole === "seller" ? "buyer" : "seller",
      customerName: input.customerUsername,
      customerEmail: input.customerEmail,
      customerPhone: String(input.customerPhone),
      expires_at: addHours(new Date(), 1),
    };
    //if the customer exists add the customer id
    if (customer) {
      escrowReqData = { ...escrowReqData, customerId: customer.id };
    }

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

    const escrowDetails = yield* _(
      escrowRequestRepo.firstOrThrow({ escrowId: data.escrowId }),
      Effect.mapError(() => new NoSuchElementException("Invalid escrow id")),
    );

    return {
      requestDetails: escrowDetails,
      isAuthenticated: !!data.currentUser,
    };
  });
};

export const confirmEscrowRequest = (
  input: z.infer<typeof confirmEscrowRequestRules> & { escrowId: string },
  currentUser: SessionUser,
) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* _(UserRepoLayer.Tag);
    const escrowRequestRepo = yield* _(EscrowRequestRepoLayer.tag);

    const escrowRequestDetails = yield* _(
      escrowRequestRepo.firstOrThrow({ escrowId: input.escrowId }),
      Effect.mapError(() => new NoSuchElementException("Invalid escrow id")),
    );

    //make sure the escrow transaction hasn't expired
    if (isBefore(escrowRequestDetails.expires_at, new Date())) {
      yield* new ExpectedError("Escrow transaction request has expired");
    }
    /**
     * the escrow request creator shouldn't be able to proceed with the escrow
     */
    if (currentUser?.id && escrowRequestDetails.senderId === currentUser.id) {
      yield* new ExpectedError("Cannot proceed: Escrow request created by you");
    }

    yield* _(findOrCreateUser(userRepo, input));
  });
};

/**
 * Find or create new user
 * */
const findOrCreateUser = (
  userRepo: UserRepository,
  input: z.infer<typeof confirmEscrowRequestRules>,
) => {
  return Effect.matchEffect(
    userRepo.firstOrThrow({ email: input.customerEmail }),
    {
      onSuccess: (user) => Effect.succeed(user),
      onFailure: (e) => handleUserCreation(userRepo, input),
    },
  );
};

const handleUserCreation = (
  userRepo: UserRepository,
  input: z.infer<typeof confirmEscrowRequestRules>,
) => {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
    const [existingUserByUsername, existingUserByPhone] = yield* _(
      Effect.all([
        userRepo.count(SearchOps.eq("username", input.customerUsername)),
        userRepo.count(SearchOps.eq("phone", input.customerPhone)),
      ]),
    );

    if (existingUserByUsername) {
      yield* new ExpectedError("Username is already taken");
    }
    if (existingUserByPhone) {
      yield* new ExpectedError("Phone is already taken");
    }

    return yield* _(
      userRepo.create({
        firstName: "",
        lastName: "",
        password: "",
        email: input.customerEmail,
        phone: String(input.customerPhone),
        username: input.customerUsername,
      }),
      Effect.flatMap(head),
    );

    //send an email to the user to notify of newly created account
  });
};
