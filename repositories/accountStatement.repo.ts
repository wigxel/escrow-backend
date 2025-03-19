import { Context, Layer } from "effect";
import { AccountStatementTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class AccountStatementRepository extends DrizzleRepo(
  AccountStatementTable,
  "id",
  { queryReferenceKey: "AccountStatementTable" },
) {}

export class AccountStatementRepo extends Context.Tag("AccountStatementRepo")<
  AccountStatementRepo,
  AccountStatementRepository
>() {}

export const AccountStatementRepoLayer = {
  tag: AccountStatementRepo,
  live: Layer.succeed(AccountStatementRepo, new AccountStatementRepository()),
};
