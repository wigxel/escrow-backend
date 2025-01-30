import { Context, Layer } from "effect";
import { bankAccountTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class BankAccountRepository extends DrizzleRepo(
  bankAccountTable,
  "id",
) {}

export class BankAccountRepo extends Context.Tag("BankAccountRepo")<
  BankAccountRepo,
  BankAccountRepository
>() {}

export const BankAccountRepoLayer = {
  tag: BankAccountRepo,
  live: Layer.succeed(BankAccountRepo, new BankAccountRepository()),
};
