import { Context, Layer } from "effect";
import { activityLogTable } from "~/migrations/tables/activitylog.table";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class ActivityLogRepository extends DrizzleRepo(
  activityLogTable,
  "id",
) {}

export class ActivityLogRepo extends Context.Tag("ActivityLogRepo")<
  ActivityLogRepo,
  ActivityLogRepository
>() {}

export const ActivityLogRepoLayer = {
  tag: ActivityLogRepo,
  live: Layer.succeed(ActivityLogRepo, new ActivityLogRepository()),
};
