import { Effect } from "effect";
import type { z } from "zod";
import type { SessionUser } from "~/layers/session-provider";
import type {
  TTransaction,
  TTransactionParticipant,
} from "~/migrations/schema";
import { TransactionRepoLayer } from "~/repositories/transaction.repo";
import { TransactionParticipantRepoLayer } from "~/repositories/transactionParticipant.repo";
import type { createTransactionRules } from "~/validationRules/transactions.rules";

export const createTransaction = (
  input: z.infer<typeof createTransactionRules>,
  currentUser: SessionUser,
) => {
  return Effect.gen(function* (_) {
    const transactionRepo = yield* _(TransactionRepoLayer.tag);
    const participantRepo = yield* _(TransactionParticipantRepoLayer.tag);

    const insertTransactionData: TTransaction = {
      title: input.title,
      description: input.description,
      status: "created",
      createdBy: currentUser.id,
    };

    const transaction = yield* _(
      transactionRepo.create(insertTransactionData),
      Effect.map((v) => v[0]),
    );

    const participantData: TTransactionParticipant = {
      role: input.creator_role,
      status: "active",
      userId: currentUser.id,
      transactionId: transaction.id,
    };

    yield* _(participantRepo.create(participantData));
  });
};
