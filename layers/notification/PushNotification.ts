import { Console, Effect } from "effect";
import { AbstractNotificationChannel } from "~/layers/notification/Channel";
import type { NotificationEvent } from "~/layers/notification/types";

export type PushNotificationEvent = NotificationEvent<
  "push",
  { deviceId: string }
>;

export class PushNotificationChannel extends AbstractNotificationChannel {
  readonly type = "PushNotification";
  readonly identifier = "push";

  send(notification: PushNotificationEvent): Effect.Effect<boolean> {
    return Effect.gen(function* (_) {
      yield* Console.log(
        "Sending Push Notification to",
        notification.params,
        notification.entity,
      );

      return false;
    });
  }
}
