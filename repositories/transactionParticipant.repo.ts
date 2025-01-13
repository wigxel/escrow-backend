import { Context, Layer } from "effect";
import { transactionparticipantTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class TransactionParticipantRepository extends DrizzleRepo(
  transactionparticipantTable,
  "id",
) {}

export class TransactionParticipantRepo extends Context.Tag(
  "TransactionParticipantRepo",
)<TransactionParticipantRepo, TransactionParticipantRepository>() {}

export const TransactionParticipantRepoLayer = {
  tag: TransactionParticipantRepo,
  live: Layer.succeed(
    TransactionParticipantRepo,
    new TransactionParticipantRepository(),
  ),
};
