import { Context, Layer } from "effect";
import { transactionTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class TransactionRepository extends DrizzleRepo(
  transactionTable,
  "id",
) {}

export class TransactionRepo extends Context.Tag("TransactionRepo")<
  TransactionRepo,
  TransactionRepository
>() {}

export const TransactionRepoLayer = {
  tag: TransactionRepo,
  live: Layer.succeed(TransactionRepo, new TransactionRepository()),
};
