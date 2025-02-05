import { Context, Layer } from "effect";
import { referralSourceTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class ReferralSourceRepository extends DrizzleRepo(
  referralSourceTable,
  "id",
) {}

export class ReferralSourceRepo extends Context.Tag("ReferralSourceRepo")<
  ReferralSourceRepo,
  ReferralSourceRepository
>() {}

export const ReferralSourcesRepoLayer = {
  Tag: ReferralSourceRepo,
  Repo: {
    Live: Layer.succeed(ReferralSourceRepo, new ReferralSourceRepository()),
  },
};
