import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";

import {
  ReferralSourceRepo,
  type ReferralSourceRepository,
} from "~/repositories/referralSource.repo";

const mock: ReferralSourceRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: 1,
        name: "google",
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
    return Effect.void;
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow: (arg) => {
    return Effect.succeed({
      id: 1,
      name: "google",
    });
  },

  update: () => {
    return Effect.succeed([{}]);
  },

  paginate: () => {
    throw new Error("Function not implemented.");
  },
  with: () => this,
};

export const extendReferralSourceRepo = extendMockImplementation(
  ReferralSourceRepo,
  () => mock,
);
export const ReferralSourceRepoTest = Layer.succeed(ReferralSourceRepo, mock);
