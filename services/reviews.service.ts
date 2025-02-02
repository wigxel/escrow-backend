import { Effect, pipe } from "effect";
import { NoSuchElementException } from "effect/Cause";
import type { z } from "zod";
import { ExpectedError, PermissionError } from "~/config/exceptions";
import type { createReviewDto } from "~/dto/review.dto";
import type { SessionUser } from "~/layers/session-provider";
import { EscrowParticipantRepoLayer } from "~/repositories/escrow/escrowParticipant.repo";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { ReviewRepo } from "~/repositories/review.repository";
import { getBuyerAndSellerFromParticipants } from "./escrow/escrow.utils";

export function createReview(
  params: z.infer<typeof createReviewDto>,
  currentUser: SessionUser,
) {
  return Effect.gen(function* (_) {
    const reviewRepo = yield* ReviewRepo;
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const escrowParticipantRepo = yield* EscrowParticipantRepoLayer.tag;
    
    const escrowDetails = yield* _(
      escrowRepo.firstOrThrow({ id: params.escrowId }),
      Effect.mapError(() => new NoSuchElementException("Invalid escrow id")),
    );

    //check if user already reviewed
    const r = yield* _(
      reviewRepo.firstOrThrow({
        reviewerId: currentUser.id,
        escrowId: escrowDetails.id,
      }),
      Effect.matchEffect({
        onSuccess: () => new ExpectedError("You already left a review"),
        onFailure: () => Effect.succeed(1),
      }),
    );

    if (!(escrowDetails.status === "completed")) {
      yield* new PermissionError("Cannot leave a review at this stage");
    }

    const participants = yield* escrowParticipantRepo.getParticipants(
      escrowDetails.id,
    );

    const { seller, buyer } =
      yield* getBuyerAndSellerFromParticipants(participants);

    if ((currentUser.id !== seller.userId) && (currentUser.id !== buyer.userId)) {
      yield* new PermissionError(
        "cannot leave a review on this escrow transaction",
      );
    }

    const revieweeId =
      currentUser.id !== seller.userId ? seller.userId : buyer.userId;

    yield* reviewRepo.create({
      escrowId: escrowDetails.id,
      reviewerId: currentUser.id,
      revieweeId,
      rating: params.rating,
      comment: params.comment,
    });
  });
}

export function updateReview() {
  return Effect.gen(function* (_) {
    const reviewRepo = yield* ReviewRepo;
  });
}

export function deleteReview() {
  return Effect.gen(function* (_) {
    const reviewRepo = yield* ReviewRepo;
  });
}
