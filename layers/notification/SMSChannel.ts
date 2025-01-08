import { Console, Effect } from "effect";
import { AbstractNotificationChannel } from "~/layers/notification/Channel";
import type { NotificationEvent } from "~/layers/notification/types";

type SMSEvent = NotificationEvent<"sms", { phoneNumber: string }>;

export class SMSChannel extends AbstractNotificationChannel {
  readonly type = "SMS";
  readonly identifier = "sms";

  send(notification: SMSEvent) {
    return Effect.gen(function* (_) {
      yield* Console.log(
        "Sending SMS TO",
        notification.params,
        notification.entity,
      );
      return false;
    });
  }
}
