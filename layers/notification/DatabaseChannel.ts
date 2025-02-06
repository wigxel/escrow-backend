import { Effect } from "effect";
import { AbstractNotificationChannel } from "~/layers/notification/Channel";
import type {
  NotificationEvent,
} from "~/layers/notification/types";
import { NotificationRepoLayer } from "~/repositories/notification.repo";

type DatabaseEvent = NotificationEvent<"database", { userId?: string }>;

export class DatabaseChannel extends AbstractNotificationChannel {
  type = "DatabaseChannel";
  identifier = "database";


  send(notification: DatabaseEvent) {
    return Effect.gen(function* (_) {
      const repo = yield* NotificationRepoLayer.Tag

      const payload = notification.entity.toDatabase()

      yield* repo.create({
        title:payload.title,
        message:payload.message,
        userId:notification.params.userId,
        tag:payload.tag,
        meta:JSON.stringify(payload.metadata)
      })
    });
  }
}
