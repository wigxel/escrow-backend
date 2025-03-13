import { Effect } from "effect";
import { ActivityLogRepoLayer } from "../../repositories/activityLog.repo";
import type { TActivityLogEvent } from "../../types/types";

export const createActivityLog = (event: TActivityLogEvent) => {
  return Effect.gen(function* () {
    const activity = yield* ActivityLogRepoLayer.tag;
    yield* activity.create(event);
  });
};

export const logActivityOnce = (event: TActivityLogEvent) => {
  return Effect.gen(function* (_) {
    const activity = yield* ActivityLogRepoLayer.tag;

    yield* _(
      activity.firstOrThrow(event),
      Effect.catchTag("NoSuchElementException", () => activity.create(event)),
      Effect.catchAll(() =>
        Effect.succeed("Skipping Activity write. Record already exists."),
      ),
    );
  });
};
