import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { runDrizzleQuery } from "~/libs/query.helpers";
import { escrowParticipantsTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class EscrowParticipantRepository extends DrizzleRepo(
  escrowParticipantsTable,
  "id",
) {
  getParticipants(escrowId: string) {
    return runDrizzleQuery((db) => {
      return db.query.escrowParticipantsTable.findMany({
        where: eq(escrowParticipantsTable.escrowId, escrowId),
      });
    });
  }
}

export class EscrowParticipantRepo extends Context.Tag("EscrowParticipantRepo")<
  EscrowParticipantRepo,
  EscrowParticipantRepository
>() {}

export const EscrowParticipantRepoLayer = {
  tag: EscrowParticipantRepo,
  live: Layer.succeed(EscrowParticipantRepo, new EscrowParticipantRepository()),
};
