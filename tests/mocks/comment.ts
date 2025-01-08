import { Effect, Layer } from "effect";
import { randomUUID } from "uncrypto";
import type { Comment, NewComments } from "~/migrations/tables/interfaces";
import {
  CommentRepo,
  type CommentRepository,
} from "~/repositories/comment.repository";
import type {
  FindArg1,
  FindArg2,
  RepoModelIdType,
  SearchableParams,
} from "~/services/repository/repo.types";
import { extendMockImplementation } from "~/tests/mocks/helpers";

const CommentRepoTest: CommentRepository = {
  create(data: NewComments) {
    return Effect.succeed([
      {
        id: randomUUID(),
        createdAt: new Date(2024, 7, 20),
        comment: "Hi",
        parentCommentId: undefined,
        ...data,
      },
    ]);
  },

  findComments(_filter: { parentCommentId?: string; reviewId?: string }) {
    return Effect.succeed([
      {
        comment: "some random comment",
        id: "commentId",
        userId: "string",
        createdAt: new Date(),
        reviewId: "string",
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        user: {} as any,
        parentCommentId: "string",
      },
    ]);
  },

  deleteOne(commentId: string) {
    return Effect.succeed([
      {
        comment: "some random comment",
        id: commentId,
        userId: "string",
        createdAt: new Date(),
        reviewId: "string",
        parentCommentId: "string",
      },
    ]);
  },

  update(commentId: string, data: Partial<Comment>) {
    return Effect.succeed([
      {
        id: commentId,
        comment: "somecomment",
        userId: "userid",
        createdAt: new Date(),
        reviewId: "reviewId",
        parentCommentId: "parentcommentid",
        ...data,
      },
    ]);
  },

  count: (params?: SearchableParams["where"]) => {
    throw new Error("Function not implemented.");
  },

  // @ts-expect-error
  find: (field: FindArg1, value?: FindArg2) => {
    return Effect.succeed({
      id: randomUUID(),
      createdAt: new Date(2024, 7, 20),
      comment: "Hi",
      userId: "MOCK_USER_ID",
      parentCommentId: undefined,
    });
  },

  firstOrThrow: (id: RepoModelIdType | SearchableParams["where"]) => {
    throw new Error("Function not implemented.");
  },

  all: (params: Partial<SearchableParams>) => {
    throw new Error("Function not implemented.");
  },

  delete: (params: SearchableParams["where"]) => {
    throw new Error("Function not implemented.");
  },
};

export const extendCommentRepo = extendMockImplementation(
  CommentRepo,
  () => CommentRepoTest,
);

export const CommentTest = extendCommentRepo({});
