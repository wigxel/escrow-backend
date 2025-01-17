import { Effect } from "effect";
import type { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";

import { EscrowTransactionRepoLayer } from "~/repositories/transaction/escrowTransaction.repo";

import type { createEscrowTransactionRules } from "~/validationRules/escrowTransactions.rules";
import type {
  TEscrowRequest,
  TEscrowTransaction,
  TUser,
} from "~/migrations/schema";
import { UserRepoLayer } from "~/repositories/user.repository";
import { EscrowRequestRepoLayer } from "~/repositories/transaction/escrowRequest.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/transaction/escrowParticipant.repo";
import { EscrowPaymentRepoLayer } from "~/repositories/transaction/escrowPayment.repo";
import { addHours } from "date-fns";
import { ExpectedError } from "~/config/exceptions";

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

      if(customer.id === currentUser.id){
        yield* new ExpectedError("You cannot create transaction with yourself")
      }
    }

    //new escrow transaction
    const escrowTransaction = yield* _(
      escrowTransactionRepo.create({
        title: input.title,
        description: input.description,
        createdBy: currentUser.id,
      }),
      Effect.map((v) => v[0]),
    );

    //add the creator to the participant table
    yield* escrowParticipantRepo.create({
      transactionId: escrowTransaction.id,
      userId: currentUser.id,
      role: input.creatorRole,
    });

    //escrow payment
    yield* escrowPaymentRepo.create({
      transactionId: escrowTransaction.id,
      amount: String(input.amount),
    });

    let escrowReqData: TEscrowRequest = {
      transactionId: escrowTransaction.id,
      customerRole: input.creatorRole === "seller" ? "buyer" : "seller",
      customerName: input.customerUsername,
      customerEmail: input.customerEmail,
      customerPhone: String(input.customerPhone),
      expires_at:addHours(new Date(),1)
    };
    //if the customer exists add the customer id
    if (customer) {
      escrowReqData = { ...escrowReqData, customerId: customer.id };
    }

    yield* escrowRequestRepo.create(escrowReqData);
    return {escrowTransactionId:escrowTransaction.id}
  });
};
