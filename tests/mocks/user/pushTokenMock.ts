import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  PushTokenRepo,
  type PushTokenRepository,
} from "~/repositories/pushToken.repo";

const mock: PushTokenRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: 1,
        userId: "user-id",
        token: "device-token",
        createdAt: new Date(2025, 2, 22),
        updatedAt: new Date(2025, 2, 22),
      },
    ]);
  },

  all: (params) => {
    return Effect.succeed([
      {
        id: 1,
        userId: "user-id",
        token: "device-token",
        createdAt: new Date(2025, 2, 22),
        updatedAt: new Date(2025, 2, 22),
      },
    ]);
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
      userId: "user-id",
      token: "device-token",
    });
  },

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendPushTokenRepo = extendMockImplementation(
  PushTokenRepo,
  () => mock,
);
export const PushTokenRepoTest = Layer.succeed(PushTokenRepo, mock);
