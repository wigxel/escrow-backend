import { Context, Layer } from "effect";
import { bankAccountVerificationTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class BankAccountVerificationRepository extends DrizzleRepo(
  bankAccountVerificationTable,
  "id",
) {}

export class BankAccountVerificationRepo extends Context.Tag(
  "BankAccountVerificationRepo",
)<BankAccountVerificationRepo, BankAccountVerificationRepository>() {}

export const BankAccountVerificationRepoLayer = {
  tag: BankAccountVerificationRepo,
  live: Layer.succeed(
    BankAccountVerificationRepo,
    new BankAccountVerificationRepository(),
  ),
};
