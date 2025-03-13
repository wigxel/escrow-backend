import { Effect } from "effect";
import {
  ReviewRepo,
  type ReviewRepository,
} from "../../repositories/review.repository";
import { extendMockImplementation } from "./helpers";

export const mock: ReviewRepository = {
  create(data) {
    return Effect.succeed([
      {
        id: "review-id",
        escrowId: "escrow-id",
        reviewerId: "reviewer-id",
        revieweeId: "reviewe-id",
        comment: "nice transaction",
        rating: 5,
        createdAt: new Date(2025, 2, 21),
        updatedAt: new Date(2025, 2, 21),
      },
    ]);
  },

  getReviews() {
    return Effect.succeed([
      {
        id: "review-id",
        escrowId: "escrow-id",
        reviewerId: "reviewer-id",
        revieweeId: "reviewe-id",
        comment: "nice transaction",
        rating: 5,
        createdAt: new Date(2025, 2, 21),
        updatedAt: new Date(2025, 2, 21),
      },
    ]);
  },

  firstOrThrow(reviewId: string) {
    return Effect.succeed({
      id: "review-id",
      escrowId: "escrow-id",
      reviewerId: "reviewer-id",
      revieweeId: "reviewe-id",
      comment: "nice transaction",
      rating: 5,
      createdAt: new Date(2025, 2, 21),
      updatedAt: new Date(2025, 2, 21),
    });
  },

  update(reviewId, data) {
    return Effect.succeed([]);
  },

  // @ts-expect-error
  delete(reviewId: string) {
    return Effect.succeed(1);
  },
};

export const extendReviewRepoMock = extendMockImplementation(
  ReviewRepo,
  () => mock,
);

export const ReviewTest = extendReviewRepoMock(mock);
