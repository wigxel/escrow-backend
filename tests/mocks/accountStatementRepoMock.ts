import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";
import {
  AccountStatementRepo,
  type AccountStatementRepository,
} from "../../repositories/accountStatement.repo";

const mock: AccountStatementRepository = {
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
      status: "pending",
      tigerbeetleTransferId: "1111111",
      userId: "user-id",
    });
  },

  update() {
    return Effect.succeed([]);
  },
};

export const extendAccountStatementRepo = extendMockImplementation(
  AccountStatementRepo,
  () => mock,
);
export const AccountStatementRepoTest = Layer.succeed(
  AccountStatementRepo,
  mock,
);
