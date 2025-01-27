import { Context, Layer } from "effect";
import { escrowWalletTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class EscrowWalletRepository extends DrizzleRepo(
  escrowWalletTable,
  "id",
) {}

export class EscrowWalletRepo extends Context.Tag("EscrowWalletRepo")<
  EscrowWalletRepo,
  EscrowWalletRepository
>() {}

export const EscrowWalletRepoLayer = {
  tag: EscrowWalletRepo,
  live: Layer.succeed(EscrowWalletRepo, new EscrowWalletRepository()),
};
