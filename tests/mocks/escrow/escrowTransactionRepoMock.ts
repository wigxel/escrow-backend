import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  EscrowTransactionRepo,
  type EscrowTransactionRepository,
} from "../../../repositories/escrow/escrowTransaction.repo";
import { notNil } from "../../../libs/query.helpers";

const escrowTransactionMock: EscrowTransactionRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: "test-id",
        status: "created",
        title: "",
        description: "",
        createdBy: "",
        createdAt: new Date(2025, 2, 20),
        updatedAt: new Date(2025, 2, 20),
      },
    ]);
  },
  //@ts-expect-error
  getEscrowDetails(escrowId) {
    return Effect.succeed({
      id: "test-id",
      status: "created",
      title: "",
      description: "",
      createdBy: "",
      createdAt: new Date(2025, 2, 20),
      updatedAt: new Date(2025, 2, 20),
      activitylog: [{}],
      paymentDetails: {},
      participants: [{}],
      escrowWalletDetails: {
        id: "test-id",
        escrowId: "escrow-id",
        tigerbeetleAccountId: "1111111",
        createdAt: new Date(2025, 2, 23),
        updatedAt: new Date(2025, 2, 23),
      },
    }).pipe(Effect.flatMap(notNil));
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
      status: "deposit.success",
      title: "",
      description: "",
      createdBy: "",
      createdAt: new Date(2025, 2, 20),
      updatedAt: new Date(2025, 2, 20),
    });
  },

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendEscrowTransactionRepo = extendMockImplementation(
  EscrowTransactionRepo,
  () => escrowTransactionMock,
);
export const EscrowTransactionRepoTest = Layer.succeed(
  EscrowTransactionRepo,
  escrowTransactionMock,
);
