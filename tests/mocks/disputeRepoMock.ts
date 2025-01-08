import { Effect, Layer } from "effect";
import { head } from "effect/Array";
import {
  DisputeRepo,
  type DisputeRepository,
} from "~/repositories/dispute.repo";
import { extendMockImplementation } from "./helpers";

const TestDisputeData = {
  id: "id",
  createdAt: new Date(2024, 6, 30),
  status: "pending",
};

const disputeMock: DisputeRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: "id",
        status: "pending",
        createdAt: new Date(2024, 6, 30),
        createdBy: "user-id",
        creatorRole: "SELLER",
        acceptedBy: "ADMIN-ID",
        resolvedBy: "ADMIN-ID",
        reason: "reason",
        orderId: "order-id",
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

  // @ts-expect-error
  find: () => {
    return Effect.succeed(structuredClone(TestDisputeData));
  },

  firstOrThrow: (arg1, arg2) => {
    return Effect.succeed(structuredClone(TestDisputeData));
  },

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendDisputeRepo = extendMockImplementation(
  DisputeRepo,
  () => disputeMock,
);
export const DisputeRepoTest = Layer.succeed(DisputeRepo, disputeMock);
