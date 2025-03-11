import { Context, Layer } from "effect";
import { userWalletTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class UserWalletRepository extends DrizzleRepo(userWalletTable, "id") {}

export class UserWalletRepo extends Context.Tag("UserWalletRepo")<
  UserWalletRepo,
  UserWalletRepository
>() {}

export const UserWalletRepoLayer = {
  tag: UserWalletRepo,
  live: Layer.succeed(UserWalletRepo, new UserWalletRepository()),
};
