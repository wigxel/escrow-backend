import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  EscrowRequestRepo,
  type EscrowRequestRepository,
} from "../../../repositories/escrow/escrowRequest.repo";

const mock: EscrowRequestRepository = {
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
    return Effect.succeed({
      id: "test-id",
      senderId: "user-id",
      amount: "10000",
      escrowId: "escrow-id",
      customerUsername: "username",
      customerPhone: "customer phone",
      customerRole: "seller",
      customerEmail: "customer-email",
      status: "pending",
      accessCode: null,
      authorizationUrl: null,
      createdAt: new Date(2025, 2, 23),
      updatedAt: new Date(2025, 2, 23),
      expiresAt: new Date(2026, 2, 23),
    });
  },

  update: () => {
    return Effect.succeed([]);
  },
};

export const extendEscrowRequestRepo = extendMockImplementation(
  EscrowRequestRepo,
  () => mock,
);
export const EscrowRequestRepoTest = Layer.succeed(EscrowRequestRepo, mock);
