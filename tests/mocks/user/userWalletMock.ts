import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import { head } from "effect/Array";
import { UserWalletRepo, type UserWalletRepository } from "~/repositories/userWallet.repo";

const mock: UserWalletRepository = {
  //@ts-expect-error
  create: (data) => {
    return Effect.succeed([
      {
        id: "test-id",
        userId: "user-id",
        tigerBeetleAccountId: "",
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
    return Effect.succeed([
      {
        id: "test-id",
        userId: "user-id",
        tigerBeetleAccountId: "",
      },
    ]).pipe(Effect.flatMap(head));
  },

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendUserWalletRepo = extendMockImplementation(
  UserWalletRepo,
  () => mock,
);
export const UserWalletRepoTest = Layer.succeed(UserWalletRepo, mock);
