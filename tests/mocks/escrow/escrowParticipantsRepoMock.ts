import { Effect, Layer } from "effect";
import { head } from "effect/Array";
import { extendMockImplementation } from "../helpers";
import {
  EscrowParticipantRepo,
  type EscrowParticipantRepository,
} from "~/repositories/escrow/escrowParticipant.repo";

const mock: EscrowParticipantRepository = {
  create: (data) => {
    return Effect.succeed([]);
  },

  all: (params) => {
    return Effect.succeed([]);
  },

  getParticipants(escrowId) {
    return Effect.succeed([
      {
        id: "id",
        escrowId: "escrow-id",
        userId: "seller-id",
        role: "buyer",
        status: "active",
      },
      {
        id: "id",
        escrowId: "escrow-id",
        userId: "buyer-id",
        role: "seller",
        status: "active",
      },
      
    ]);
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
    return Effect.succeed([{}]).pipe(Effect.flatMap(head));
  },

  update: () => {
    return Effect.succeed([{}]);
  },
};

export const extendEscrowParticipantRepo = extendMockImplementation(
  EscrowParticipantRepo,
  () => mock,
);
export const EscrowParticipantRepoTest = Layer.succeed(
  EscrowParticipantRepo,
  mock,
);
