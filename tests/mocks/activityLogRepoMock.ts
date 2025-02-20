import { Effect, Layer } from "effect";
import { head } from "effect/Array";

import {
  ActivityLogRepo,
  type ActivityLogRepository,
} from "~/repositories/activityLog.repo";
import { extendMockImplementation } from "./helpers";

const mock: ActivityLogRepository = {
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
    return Effect.void;
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow: (arg) => {
    return Effect.succeed({ entityId: "", kind: "" });
  },

  update() {
    return Effect.succeed([]);
  },
};

export const extendActivityLogRepo = extendMockImplementation(
  ActivityLogRepo,
  () => mock,
);
export const ActivityLogRepoTest = Layer.succeed(ActivityLogRepo, mock);
