import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";
import {
  WithdrawalRepo,
  type WithdrawalRepository,
} from "../../repositories/withdrawal.repo";

const mock: WithdrawalRepository = {
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
    return Effect.succeed({
      id: "test-id",
      amount: "10000",
      referenceCode: "ref_CODE",
      status: "pending",
      tigerbeetleTransferId: "1111111",
      userId: "user-id",
    });
  },

  update() {
    return Effect.succeed([]);
  },
};

export const extendWithdrawalRepo = extendMockImplementation(
  WithdrawalRepo,
  () => mock,
);
export const WithdrawalRepoTest = Layer.succeed(WithdrawalRepo, mock);
