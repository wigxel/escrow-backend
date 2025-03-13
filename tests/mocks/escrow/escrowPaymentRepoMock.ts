import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  EscrowPaymentRepo,
  type EscrowPaymentRepository,
} from "../../../repositories/escrow/escrowPayment.repo";

const mockData = {
  id: "test-id",
  amount: "10000",
  escrowId: "escrow-id",
  userId: "user-id",
  fee: "0",
  method: "card",
  status: "success" as "success" | "pending" | "cancelled" | "failed",
  createdAt: new Date(2025, 2, 23),
  updatedAt: new Date(2025, 2, 23),
};

//@ts-expect-error
const mock: EscrowPaymentRepository = {
  create: (data) => {
    return Effect.succeed([mockData]);
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

  firstOrThrow: (arg1, arg2) => {
    return Effect.succeed(mockData);
  },

  update: () => {
    return Effect.succeed([mockData]);
  },
};

export const extendEscrowPaymentRepo = extendMockImplementation(
  EscrowPaymentRepo,
  () => mock,
);
export const EscrowPaymentRepoTest = Layer.succeed(EscrowPaymentRepo, mock);
