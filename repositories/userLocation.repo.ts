import { Context, Layer } from "effect";
import { addressTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class UserLocationRepository extends DrizzleRepo(addressTable, "id") {}

export class UserLocationRepo extends Context.Tag("UserLocationRepo")<
  UserLocationRepo,
  UserLocationRepository
>() {}

export const UserLocationRepoLive = Layer.succeed(
  UserLocationRepo,
  new UserLocationRepository(),
);

export const UserLocationRepoLayer = {
  Tag: UserLocationRepo,
  Repo: {
    Live: UserLocationRepoLive,
  },
};
