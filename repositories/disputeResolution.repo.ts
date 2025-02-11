import { Context, Layer } from "effect";
import { disputeResolutionTable, referralSourceTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class DisputeResolutionsRepository extends DrizzleRepo(
  disputeResolutionTable,
  "id",
) {}

export class DisputeResolutionsRepo extends Context.Tag("DisputeResolutionsRepo")<
  DisputeResolutionsRepo,
  DisputeResolutionsRepository
>() {}

export const DisputeResolutionssRepoLayer = {
  Tag: DisputeResolutionsRepo,
  Repo: {
    Live: Layer.succeed(DisputeResolutionsRepo, new DisputeResolutionsRepository()),
  },
};
