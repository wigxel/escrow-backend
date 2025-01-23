import { Context, Layer } from "effect";
import { escrowParticipantsTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class EscrowParticipantRepository extends DrizzleRepo(
  escrowParticipantsTable,
  "id",
) {}

export class EscrowParticipantRepo extends Context.Tag(
  "EscrowParticipantRepo",
)<EscrowParticipantRepo, EscrowParticipantRepository>() {}

export const EscrowParticipantRepoLayer = {
  tag: EscrowParticipantRepo,
  live: Layer.succeed(
    EscrowParticipantRepo,
    new EscrowParticipantRepository(),
  ),
};
