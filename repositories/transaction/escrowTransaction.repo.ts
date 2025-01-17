import { Context, Layer } from "effect";
import { escrowTransactionTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class EscrowTransactionRepository extends DrizzleRepo(
  escrowTransactionTable,
  "id",
) {}

export class EscrowTransactionRepo extends Context.Tag("EscrowTransactionRepo")<
  EscrowTransactionRepo,
  EscrowTransactionRepository
>() {}

export const EscrowTransactionRepoLayer = {
  tag: EscrowTransactionRepo,
  live: Layer.succeed(EscrowTransactionRepo, new EscrowTransactionRepository()),
};
