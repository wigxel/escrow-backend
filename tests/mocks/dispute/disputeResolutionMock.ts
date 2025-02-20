import { Effect, Layer } from "effect";
import { head } from "effect/Array";
import { extendMockImplementation } from "../helpers";
import { DisputeResolutionsRepo, type DisputeResolutionsRepository } from "~/repositories/disputeResolution.repo";

const mock: DisputeResolutionsRepository = {
  create: (data) => {
    return Effect.succeed([]);
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

export const extendDisputeResolutionyRepo = extendMockImplementation(
  DisputeResolutionsRepo,
  () => mock,
);
export const DisputeResolutionRepoTest = Layer.succeed(
  DisputeResolutionsRepo,
  mock,
);
