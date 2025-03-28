import { Effect } from "effect";
import { createFactory } from "~/migrations/seeds/setup";
import { EscrowParticipantRepo } from "~/repositories/escrow/escrowParticipant.repo";

export const EscrowParticipantsFactory = createFactory(
  EscrowParticipantRepo,
  ($faker) => {
    return Effect.succeed({
      escrowId: undefined,
      userId: undefined,
      role: undefined,
      status: "active",
    });
  },
);
