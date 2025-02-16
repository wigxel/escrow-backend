import { Console, Effect } from "effect";
import { AbstractNotificationChannel } from "~/layers/notification/Channel";
import {
  Notification,
  type NotificationEvent,
} from "~/layers/notification/types";
import { PushService } from "~/services/pushNotification/push";

export type PushNotificationEvent = NotificationEvent<
  "push",
  { deviceToken: string }
>;

export class PushNotificationChannel extends AbstractNotificationChannel {
  readonly type = "PushNotification";
  readonly identifier = "push";

  send(notification: PushNotificationEvent) {
    return Effect.gen(function* (_) {
      const push = yield* PushService;

      if (notification.entity instanceof Notification) {
        const payload = notification.entity.toPush();
        yield* Effect.tryPromise(() => {
          return push.send({
            token: notification.params.deviceToken,
            notification: payload,
          });
        });

        return true;
      }

      return false;
    });
  }
}
