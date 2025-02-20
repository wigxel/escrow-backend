import { Effect, Layer } from "effect";
import { extendMockImplementation } from "../helpers";
import {
  DisputeRepo,
  type DisputeRepository,
} from "~/repositories/dispute.repo";
import { head } from "effect/Array";

const disputeMock: DisputeRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: "test-id",
        escrowId: "escrow-id",
        status: "pending",
        createdBy: "creator-id",
        acceptedBy: "",
        categoryId: 1,
        resolutionId: 1,
        creatorRole: "seller",
        reason: "reason for dispute",
        resolvedBy: "",
        createdAt: new Date(2, 2, 2000),
      },
    ]);
  },

  getByUserId(params) {
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
