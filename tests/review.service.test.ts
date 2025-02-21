import { Effect, Layer } from "effect";
import { NoSuchElementException } from "effect/Cause";
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
  describe("create review", () => {
    const currentUser = {
      id: "reviewer-id",
      username: "username",
      email: "",
      phone: "",
      role: "user",
    };
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
      expect(result?.meta?.total).toBe(reviewCount)
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
      `)
    });
  });

  it("should delete a review", async () => {
    const program = Effect.scoped(
      Effect.provide(deleteReview("MOCK_REVIEW_ID", "MOCK_USER_ID"), AppTest),
    );

    const review = await runTest(program);
    expect(review).toHaveProperty("rating", 3);
  });

  it("should fail delete review for invalid id", async () => {
    const reviewRepo = extendReviewRepoMock({
      // @ts-expect-error
      firstOrThrow() {
        return Effect.succeed({
          userId: "MOCK_USER_ID_2",
        });
      },
    });
    const program = Effect.provide(
      deleteReview("MOCK_FAKE_REVIEW_ID", "MOCK_USER_ID"),
      reviewRepo,
    );

    const response = await runTest(program);
    expect(response).toMatchInlineSnapshot(
      `[PermissionError: You are not authorized to make this request]`,
    );
  });

  it("should fail delete review for user permissions", async () => {
    const program = Effect.scoped(
      Effect.provide(
        deleteReview("MOCK_REVIEW_ID", "MOCK_FAKE_USER_ID"),
        AppTest,
      ),
    );

    const response = await runTest(program);
    expect(response).toMatchInlineSnapshot(
      `[PermissionError: You are not authorized to make this request]`,
    );
  });

  // For comments
  it("should return comments", async () => {
    const program = Effect.scoped(
      Effect.provide(
        readComments({
          reviewId: "MOCK_REVIEW_COMMENT_ID",
        }),
        AppTest,
      ),
    );

    const reviews = await runTest(program);
    expect(reviews).to.be.toBeInstanceOf(Array);
  });

  it("should create comments", async () => {
    const program = Effect.scoped(
      Effect.provide(
        createComment({
          comment: "somecomment",
          reviewId: "MOCK_REVIEW_ID",
          userId: "userId",
          createdAt: new Date(),
          parentCommentId: "MOCK_PARENT_COMMENT_ID",
        }),
        AppTest,
      ),
    );

    const review = await runTest(program);
    expect(review).toHaveProperty("reviewId", "MOCK_REVIEW_ID");
  });

  it("should update comments", async () => {
    const program = Effect.scoped(
      Effect.provide(
        updateComment("MOCK_COMMENT_ID", "MOCK_USER_ID", {
          comment: "somecomment",
          reviewId: "MOCK_REVIEW_ID",
          createdAt: new Date(),
          parentCommentId: "MOCK_PARENT_COMMENT_ID",
        }),
        AppTest,
      ),
    );

    const review = await runTest(program);
    expect(review).to.be.instanceOf(Array);
  });

  it("should fail update comments for invalid id", async () => {
    const commentRepo = extendCommentRepo({
      // @ts-expect-error
      find() {
        return Effect.succeed({
          id: "MOCK_COMMENT_ID",
        });
      },
    });

    const program = Effect.scoped(
      Effect.provide(
        updateComment("MOCK_FAKE_COMMENT_ID", "MOCK_USER_ID", {
          comment: "somecomment",
          reviewId: "MOCK_REVIEW_ID",
          createdAt: new Date(),
          parentCommentId: "MOCK_PARENT_COMMENT_ID",
        }),
        commentRepo,
      ),
    );

    const response = await runTest(program);
    expect(response).toMatchInlineSnapshot(
      `[PermissionError: Not authorized to perform this action]`,
    );
  });

  it.skip("should fail update comments for user permissions", async () => {
    const program = Effect.scoped(
      Effect.provide(
        updateComment("MOCK_REVIEW_ID", "MOCK_FAKE_USER_ID", {
          comment: "somecomment",
          reviewId: "MOCK_REVIEW_ID",
          createdAt: new Date(),
          parentCommentId: "MOCK_PARENT_COMMENT_ID",
        }),
        AppTest,
      ),
    );

    runTest(program);
    expect.fail(
      "comment update should fail if comment author (user) doesn't match for given userId",
    );
  });

  it.skip("should fail delete comments for invalid id", async () => {
    const program = Effect.scoped(
      Effect.provide(
        deleteComment("MOCK_FAKE_COMMENT_ID", "MOCK_USER_ID"),
        AppTest,
      ),
    );

    runTest(program);
    expect.fail(
      "deleting comment should fail if comment author (user) doesn't match for given commentId",
    );
  });

  it.skip("should fail delete comments for user permissions", async () => {
    const program = Effect.scoped(
      Effect.provide(
        deleteComment("MOCK_REVIEW_ID", "MOCK_FAKE_USER_ID"),
        AppTest,
      ),
    );

    runTest(program);
    expect.fail(
      "deleting comment should fail if comment author (user) doesn't match for given userId",
    );
  });
});
