import { safeObj } from "@repo/shared/src/data.helpers";
import { Effect, Layer } from "effect";
import { NoSuchElementException } from "effect/Cause";
import { randomUUID } from "uncrypto";
import {
  createComment,
  createReview,
  deleteComment,
  deleteReview,
  readComments,
  readReviews,
  updateComment,
  updateReview,
} from "~/services/reviews.service";
import { AppTest, runTest } from "~/tests/mocks/app";
import { extendCommentRepo } from "~/tests/mocks/comment";
import { extendProductRepo } from "~/tests/mocks/productRepoMock";
import { extendReviewRepoMock } from "./mocks/review";

describe("Review service", () => {
  it("should return reviews", async () => {
    const program = Effect.scoped(Effect.provide(readReviews(), AppTest));

    const reviews = await Effect.runPromise(program);
    expect(reviews).to.be.toBeInstanceOf(Array);
  });

  it("should create Review", async () => {
    const ProductRepo = extendProductRepo({
      // @ts-expect-error
      update({ ownerId, id: productId }, data) {
        return Effect.succeed({
          id: productId ?? randomUUID(),
          name: "somename",
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: ownerId ?? "someowner",
          categoryId: 1,
          description: "somedescription",
          price: "0.00",
          rating: "0.00",
          published: true,
          availability: true,
          productLocation: [],
          productImages: [],
          ...safeObj(data),
        });
      },

      // @ts-expect-error
      find: () => Effect.succeed({}),
    });

    const ReviewRepo = extendReviewRepoMock({
      firstOrThrow() {
        return Effect.succeed(null);
      },
    });

    const program = Effect.provide(
      createReview({
        productId: randomUUID(),
        userId: randomUUID(),
        comment: "Sample comment",
        createdAt: new Date(),
        images: [],
        rating: 5,
      }),
      ProductRepo.pipe(Layer.provideMerge(ReviewRepo)),
    );

    const review = await runTest(program);
    expect(review).toHaveProperty("rating", 5);
  });

  it("should update review", async () => {
    const program = Effect.provide(
      updateReview("MOCK_REVIEW_ID", "MOCK_USER_ID", {
        productId: "random product id",
        comment: "Sample comment",
        createdAt: new Date(),
        images: [],
        rating: 5,
      }),
      AppTest,
    );

    const review = await runTest(program);
    expect(review).toHaveProperty("rating", 5);
  });

  it("should fail update review for invalid id", async () => {
    const reviewRepoTest = extendReviewRepoMock({
      firstOrThrow() {
        return Effect.fail(new NoSuchElementException("Review does not exist"));
      },
    });
    const program = Effect.scoped(
      Effect.provide(
        updateReview("MOCK_FAKE_REVIEW_ID", "MOCK_USER_ID", {
          productId: "random product id",
          comment: "Sample comment",
          createdAt: new Date(),
          images: [],
          rating: 2,
        }),
        reviewRepoTest,
      ),
    );

    expect(await runTest(program)).toMatchInlineSnapshot(
      `[NoSuchElementException: Review does not exist]`,
    );
  });

  it("should fail update review for user permissions", async () => {
    const program = Effect.scoped(
      Effect.provide(
        updateReview("MOCK_REVIEW_ID", "MOCK_FAKE_USER_ID", {
          productId: "random product id",
          comment: "Sample comment",
          createdAt: new Date(),
          images: [],
          rating: 2,
        }),
        AppTest,
      ),
    );

    const response = await runTest(program);
    expect(response).toMatchInlineSnapshot(
      `[PermissionError: You are not authorized to make this request]`,
    );
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
