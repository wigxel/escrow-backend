import { Effect, Layer } from "effect";
import {
  createReview,
  deleteReview,
  getReviews,
} from "~/services/reviews.service";
import { AppTest, runTest } from "~/tests/mocks/app";
import { extendReviewRepoMock } from "./mocks/review";
import { extendEscrowTransactionRepo } from "./mocks/escrow/escrowTransactionRepoMock";
import { notNil } from "~/libs/query.helpers";
import { extendEscrowParticipantRepo } from "./mocks/escrow/escrowParticipantsRepoMock";

describe("Review service", () => {
  const currentUser = {
    id: "reviewer-id",
    username: "username",
    email: "",
    phone: "",
    role: "user",
  };
  describe("create review", () => {
    const reviewData = {
      escrowId: "escrow-id",
      comment: "this is a comment",
      rating: 5,
    };

    test("should fail if invalid escrow id", async () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = createReview(reviewData, currentUser);
      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid escrow id]`,
      );
    });

    test("should fail if user already reviewd", () => {
      const program = createReview(reviewData, currentUser);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: You already left a review]`,
      );
    });

    test("should fail if the escrow transaction status is at completed", () => {
      const reviewRepo = extendReviewRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            status: "completed",
          });
        },
      });

      const program = createReview(reviewData, currentUser);
      const result = runTest(
        Effect.provide(program, Layer.merge(escrowRepo, reviewRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[PermissionError: cannot leave a review on this escrow transaction]`,
      );
    });

    test("should fail if only one participant", () => {
      const reviewRepo = extendReviewRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            status: "completed",
          });
        },
      });

      const escrowParticipantRepo = extendEscrowParticipantRepo({
        getParticipants(escrowId) {
          return Effect.succeed([
            {
              id: "user-id",
              escrowId: "escrow-id",
              userId: "seller-id",
              role: "buyer",
              status: "active",
            },
          ]);
        },
      });

      const program = createReview(reviewData, currentUser);
      const result = runTest(
        Effect.provide(
          program,
          reviewRepo.pipe(
            Layer.provideMerge(escrowRepo),
            Layer.provideMerge(escrowParticipantRepo),
          ),
        ),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid participants. Seller or buyer not found.]`,
      );
    });

    test("should fail if reviewer not escrow participant", () => {
      const reviewRepo = extendReviewRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            status: "completed",
          });
        },
      });

      const program = createReview(reviewData, currentUser);
      const result = runTest(
        Effect.provide(program, Layer.merge(reviewRepo, escrowRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[PermissionError: cannot leave a review on this escrow transaction]`,
      );
    });

    test("should create Review", async () => {
      let isReviewCreated = false;
      const reviewRepo = extendReviewRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
        create() {
          isReviewCreated = true;
          return Effect.succeed([]);
        },
      });

      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow() {
          return Effect.succeed({
            status: "completed",
          });
        },
      });

      const program = createReview(reviewData, {
        ...currentUser,
        id: "buyer-id",
      });
      const result = await runTest(
        Effect.provide(program, Layer.merge(reviewRepo, escrowRepo)),
      );
      expect(isReviewCreated).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Review added successfully",
          "status": "success",
        }
      `);
    });
  });

  describe(" Get reviews", () => {
    test("should return reviews", async () => {
      let reviewCount = 1;
      const reviewRepo = extendReviewRepoMock({
        reviewCount() {
          return Effect.succeed({ count: reviewCount });
        },
      });

      const program = getReviews({ escrowId: "escrow-id" });
      const result = await runTest(Effect.provide(program, reviewRepo));
      expect(result?.meta?.total).toBe(reviewCount);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "comment": "nice transaction",
              "createdAt": 2025-03-20T23:00:00.000Z,
              "escrowId": "escrow-id",
              "id": "review-id",
              "rating": 5,
              "revieweeId": "reviewe-id",
              "reviewerId": "reviewer-id",
              "updatedAt": 2025-03-20T23:00:00.000Z,
            },
          ],
          "meta": {
            "current_page": 1,
            "per_page": 5,
            "total": 1,
            "total_pages": 1,
          },
          "status": "success",
        }
      `);
    });
  });

  describe("Delete review", () => {
    test("should fail delete review for invalid id", async () => {
      const reviewRepo = extendReviewRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = deleteReview({
        reviewId: "MOCK_FAKE_REVIEW_ID",
        currentUser,
      });
      const response = runTest(Effect.provide(program, reviewRepo));
      expect(response).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid review Id]`,
      );
    });

    test("should fail current user didn't create the review", () => {
      const program = deleteReview({
        reviewId: "MOCK_FAKE_REVIEW_ID",
        currentUser: { ...currentUser, id: "MOCK_FAKE_USER_ID" },
      });

      const response = runTest(program);
      expect(response).resolves.toMatchInlineSnapshot(
        `[PermissionError: Cannot delete this review]`,
      );
    });

    test("should delete the review", async () => {
      let isReviewDeleted = false;
      const reviewRepo = extendReviewRepoMock({
        delete() {
          isReviewDeleted = true;
          return Effect.succeed(true);
        },
      });
      const program = Effect.provide(
        deleteReview({ reviewId: "MOCK_FAKE_REVIEW_ID", currentUser }),
        reviewRepo,
      );

      const result = await runTest(program);
      expect(isReviewDeleted).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Review deleted successfully",
          "status": "success",
        }
      `);
    });
  });
});
