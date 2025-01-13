import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";
import { DisputeRepo, DisputeRepository } from "~/repositories/dispute.repo";
import { head } from "effect/Array";

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

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow: (arg1, arg2) => {
    return Effect.succeed([
      {
        id: "id",
        createdAt: new Date(2024, 6, 30),
        status: "pending",
      },
    ]).pipe(Effect.flatMap(head));
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
