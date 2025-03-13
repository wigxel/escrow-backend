import { Effect, Layer } from "effect";
import { head } from "effect/Array";
import { extendMockImplementation } from "../helpers";
import {
  DisputeCategoryRepo,
  type DisputeCategoryRepository,
} from "../../../repositories/disputeCategories.repo";

const disputeCategoryMock: DisputeCategoryRepository = {
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

export const extendDisputeCategoryRepo = extendMockImplementation(
  DisputeCategoryRepo,
  () => disputeCategoryMock,
);
export const DisputeCategoryRepoTest = Layer.succeed(
  DisputeCategoryRepo,
  disputeCategoryMock,
);
