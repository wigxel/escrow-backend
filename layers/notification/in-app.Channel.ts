import { Effect } from "effect";
import { AbstractNotificationChannel } from "~/layers/notification/Channel";
import {
  Notification,
  type NotificationEvent,
} from "~/layers/notification/types";
import { NotificationRepoLayer } from "~/repositories/notification.repo";

type InAppEvent = NotificationEvent<"in-app", { userId?: string }>;

export class InAppChannel extends AbstractNotificationChannel {
  type = "InAppChannel";
  identifier = "in-app";

  send(notification: InAppEvent) {
    return Effect.gen(function* (_) {
      const repo = yield* NotificationRepoLayer.Tag;

      if (notification.entity instanceof Notification) {
        const payload = notification.entity.toDatabase();

        yield* repo.create({
          title: payload.title,
          message: payload.message,
          userId: notification.params.userId,
          tag: payload.tag,
          meta: JSON.stringify(payload.metadata),
        });
      }
    });
  }
}
