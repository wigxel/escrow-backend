import { Effect } from "effect";
import { randomUUID } from "uncrypto";
import { NewReview, Review } from "~/migrations/tables/interfaces";
import { ReviewRepo, ReviewRepository } from "~/repositories/review.repository";
import { extendMockImplementation } from "./helpers";

export const MockMethods: ReviewRepository = {
  // @ts-expect-error
  create(data: Required<NewReview>) {
    return Effect.succeed({
      id: randomUUID(),
      ...data,
    });
  },

  findOne(reviewId: string) {
    return Effect.succeed({
      id: reviewId,
      createdAt: new Date(),
      productId: "string",
      rating: 2,
      userId: "MOCK_USER_ID",
      images: [],
      user: {
        id: "any",
        firstName: "any",
        lastName: "any",
        profilePicture: "any",
        emailVerified: true,
      },
      comment: "string",
    });
  },

  findFirst() {
    return Effect.succeed({
      id: "reviewId",
      createdAt: new Date(),
      productId: "string",
      rating: 2,
      userId: "MOCK_USER_ID",
      images: [],
      user: {
        id: "any",
        firstName: "any",
        lastName: "any",
        profilePicture: "any",
        emailVerified: true,
      },
      comment: "string",
    });
  },

  firstOrThrow(reviewId: string) {
    return Effect.succeed({
      id: reviewId,
      createdAt: new Date(),
      productId: "string",
      rating: 2,
      userId: "MOCK_USER_ID",
      images: [],
      user: {
        id: "any",
        firstName: "any",
        lastName: "any",
        profilePicture: "any",
        emailVerified: true,
      },
      comment: "string",
    });
  },

  // @ts-expect-error
  findProductReviews(_filter: Partial<Review> = {}) {
    return Effect.succeed([
      {
        id: "string",
        createdAt: new Date(),
        productId: "string",
        rating: 5,
        userId: "string",
        images: [],
        user: {
          id: "any",
          firstName: "any",
          lastName: "any",
          profilePicture: "any",
          emailVerified: true,
        },
        comment: [],
      },
    ]);
  },

  update(reviewId, data) {
    return Effect.succeed({
      id: reviewId,
      createdAt: new Date(),
      productId: "string",
      rating: 2,
      userId: "MOCK_USER_ID",
      images: [],
      user: {
        id: "any",
        firstName: "any",
        lastName: "any",
        profilePicture: "any",
        emailVerified: true,
      },
      comment: "review",

      // @ts-expect-error
      ...data,
    });
  },

  // @ts-expect-error
  delete(reviewId: string) {
    return Effect.succeed({
      id: reviewId,
      createdAt: new Date(),
      productId: "string",
      rating: 3,
      userId: "MOCK_USER_ID",
      images: [],
      user: {
        id: "any",
        firstName: "any",
        lastName: "any",
        profilePicture: "any",
        emailVerified: true,
      },
      comment: [],
    });
  },
};

export const extendReviewRepoMock = extendMockImplementation(
  ReviewRepo,
  () => ({
    ...MockMethods,
  }),
);

export const ReviewTest = extendReviewRepoMock(MockMethods);
