import { Effect } from "effect";
import { ActivityLogRepoLayer } from "~/repositories/activityLog.repo";
import type { TActivityLogEvent } from "~/types/types";

export const createActivityLog = (event: TActivityLogEvent)=> {
  return Effect.gen(function* () {
    const activity = yield* ActivityLogRepoLayer.tag;
    yield* activity.create(event);
  });
}
