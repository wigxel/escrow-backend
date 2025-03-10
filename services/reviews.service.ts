import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";
import type { z } from "zod";
import { ExpectedError, PermissionError } from "~/config/exceptions";
import type { createReviewDto, reviewFilterDto } from "~/dto/review.dto";
import type { SessionUser } from "~/layers/session-provider";
import { EscrowParticipantRepoLayer } from "~/repositories/escrow/escrowParticipant.repo";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { ReviewRepo } from "~/repositories/review.repository";
import { getBuyerAndSellerFromParticipants } from "./escrow/escrow.utils";
import { PaginationService } from "./search/pagination.service";
import { SearchOps } from "./search/sql-search-resolver";
import { dataResponse } from "~/libs/response";
import { CommentRepoLayer } from "~/repositories/comment.repo";
import { head } from "effect/Array";

export function createReview(
	params: z.infer<typeof createReviewDto>,
	currentUser: SessionUser,
) {
	return Effect.gen(function* (_) {
		const reviewRepo = yield* ReviewRepo;
		const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
		const escrowParticipantRepo = yield* EscrowParticipantRepoLayer.tag;
		const commentRepo = yield* CommentRepoLayer.tag;

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

		if (currentUser.id !== seller.userId && currentUser.id !== buyer.userId) {
			yield* new PermissionError(
				"cannot leave a review on this escrow transaction",
			);
		}

		const revieweeId =
			currentUser.id !== seller.userId ? seller.userId : buyer.userId;
    
		const review = yield* reviewRepo.create({
			escrowId: escrowDetails.id,
			reviewerId: currentUser.id,
			revieweeId,
			rating: params.rating,
		}).pipe(Effect.flatMap(head));

    //add the comment
    yield* commentRepo.create({
      reviewId:review.id,
      userId:currentUser.id,
      comment:params.comment
    })

		return dataResponse({ message: "Review added successfully" });
	});
}

export function getReviews(filters: z.infer<typeof reviewFilterDto>) {
	return Effect.gen(function* (_) {
		const reviewRepo = yield* ReviewRepo;
		const paginate = yield* PaginationService;

		const reviewCount = yield* reviewRepo.reviewCount(filters);
		const reviews = yield* reviewRepo.getReviews({
			...filters,
			...paginate.query,
		});

		return dataResponse({
			data: reviews,
			meta: {
				...paginate.meta,
				total: reviewCount.count,
				total_pages: Math.ceil(reviewCount.count / paginate.query.pageSize),
			},
		});
	});
}

export function deleteReview(params: {
	reviewId: string;
	currentUser: SessionUser;
}) {
	return Effect.gen(function* (_) {
		const reviewRepo = yield* ReviewRepo;

		const review = yield* _(
			reviewRepo.firstOrThrow({
				id: params.reviewId,
			}),
			Effect.mapError(() => new NoSuchElementException("Invalid review Id")),
		);

		if (params.currentUser.id !== review.reviewerId) {
			yield* new PermissionError("Cannot delete this review");
		}

		yield* reviewRepo.delete(SearchOps.eq("id", params.reviewId));
		return dataResponse({ message: "Review deleted successfully" });
	});
}
