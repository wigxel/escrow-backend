import { Context, Layer } from "effect";
import { disputeTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class DisputeRepository extends DrizzleRepo(disputeTable, "id") {}

export class DisputeRepo extends Context.Tag("DisputeRepo")<
  DisputeRepo,
  DisputeRepository
>() {}

export const DisputeRepoLayer = {
  Tag: DisputeRepo,
  Repo: {
    Live: Layer.succeed(DisputeRepo, new DisputeRepository()),
  },
};
