import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  CommentRepo,
  type CommentRepository,
} from "~/repositories/comment.repo";

export const mock: CommentRepository = {
  create(data) {
    return Effect.succeed([
      {
        id: "comment-id",
        userId: "user-id",
        reviewId: "review-id",
        comment: "sample-comment",
        createdAt: new Date(2025, 3, 18),
        updatedAt: new Date(2025, 3, 18),
      },
    ]);
  },

  firstOrThrow(reviewId: string) {
    return Effect.succeed({
      id: "comment-id",
      userId: "user-id",
      reviewId: "review-id",
      comment: "sample-comment",
      createdAt: new Date(2025, 3, 18),
      updatedAt: new Date(2025, 3, 18),
    });
  },

  update() {
    return Effect.succeed([]);
  },

  delete() {
    return Effect.succeed(1);
  },

  find: () => {
    throw new Error("Function not implemented.");
  },
  all: (params) => {
    return Effect.succeed([]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },
  paginate: () => {
    throw new Error("Function not implemented.");
  },
  with: () => this,
};

export const extendCommentsRepoMock = extendMockImplementation(
  CommentRepo,
  () => mock,
);
export const CommentsTestRepoTest = Layer.succeed(CommentRepo, mock);
