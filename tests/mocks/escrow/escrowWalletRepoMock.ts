import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  EscrowWalletRepo,
  type EscrowWalletRepository,
} from "../../../repositories/escrow/escrowWallet.repo";

const mock: EscrowWalletRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: "test-id",
        escrowId: "escrow-id",
        tigerbeetleAccountId: "1111111",
        createdAt: new Date(2025, 2, 23),
        updatedAt: new Date(2025, 2, 23),
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
    return Effect.succeed([]);
  },

  firstOrThrow: (arg1, arg2) => {
    return Effect.succeed({
      id: "test-id",
      escrowId: "escrow-id",
      tigerbeetleAccountId: "1111111",
      createdAt: new Date(2025, 2, 23),
      updatedAt: new Date(2025, 2, 23),
    });
  },

  update: () => {
    return Effect.succeed([]);
  },
};

export const extendEscrowWalletRepo = extendMockImplementation(
  EscrowWalletRepo,
  () => mock,
);
export const EscrowWalletRepoTest = Layer.succeed(EscrowWalletRepo, mock);
