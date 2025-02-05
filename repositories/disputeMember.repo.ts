import { Context, Layer } from "effect";
import { disputeMembersTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class DisputeMemberRepository extends DrizzleRepo(
  disputeMembersTable,
  "id",
) {}

export class DisputeMemberRepo extends Context.Tag("DisputeMemberRepo")<
  DisputeMemberRepo,
  DisputeMemberRepository
>() {}

export const DisputeMembersRepoLayer = {
  Tag: DisputeMemberRepo,
  Repo: {
    Live: Layer.succeed(DisputeMemberRepo, new DisputeMemberRepository()),
  },
};
