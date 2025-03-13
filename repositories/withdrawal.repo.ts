import { Context, Layer } from "effect";
import { bankAccountTable, withdrawalTable } from "../migrations/schema";
import { DrizzleRepo } from "../services/repository/RepoHelper";

export class WithdrawalRepository extends DrizzleRepo(withdrawalTable, "id") {}

export class WithdrawalRepo extends Context.Tag("WithdrawalRepo")<
  WithdrawalRepo,
  WithdrawalRepository
>() {}

export const WithdrawalRepoLayer = {
  tag: WithdrawalRepo,
  live: Layer.succeed(WithdrawalRepo, new WithdrawalRepository()),
};
