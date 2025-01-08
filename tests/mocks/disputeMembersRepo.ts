import { Effect, Layer } from "effect";
import { head } from "effect/Array";
import {
  DisputeMemberRepo,
  type DisputeMemberRepository,
} from "~/repositories/disputeMember.repo";
import { extendMockImplementation } from "./helpers";

const disputeMemberMock: DisputeMemberRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: 1,
        disputeId: "dispute-id",
        userId: "user-id",
        role: "BUYER",
      },
    ]);
  },

  all: (params) => {
    return Effect.succeed([]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  delete: (params) => {
    return Effect.succeed({});
  },

  // @ts-expect-error
  find: (arg1, arg2) => {
    return Effect.succeed([{}]);
  },

  firstOrThrow: (arg1, arg2) => {
    return Effect.succeed([{}]).pipe(Effect.flatMap(head));
  },

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendDisputeMemberRepo = extendMockImplementation(
  DisputeMemberRepo,
  () => disputeMemberMock,
);
export const DisputeMemberRepoTest = Layer.succeed(
  DisputeMemberRepo,
  disputeMemberMock,
);
