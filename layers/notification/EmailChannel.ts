import { Config, Console, Effect } from "effect";
import { Mailer } from "~/layers/mailing";
import { Mailable } from "~/layers/mailing/mailables";
import { AbstractNotificationChannel } from "~/layers/notification/Channel";
import {
  Notification,
  type NotificationEvent,
} from "~/layers/notification/types";

type EmailEvent = NotificationEvent<"mail", { address: string }>;

/** Handles all Email notifications */
export class EmailChannel extends AbstractNotificationChannel {
  type = "EmailChannel";
  identifier = "mail";

  public value: {
    html: string;
    text: string;
  };

  send(notification: EmailEvent) {
    return Effect.gen(function* (_) {
      const mailer = yield* Mailer;
      const app_name = yield* Config.string("APP_NAME");
      const from_address = yield* Config.string("MAIL_FROM");

      yield* Console.log("Sending Email to", {
        from_address,
        app_name,
        payload: notification,
      });

      const mailable =
        notification.entity instanceof Mailable
          ? notification.entity
          : notification.entity instanceof Notification
            ? Mailable.fromMessage(
                notification.entity.toMail(notification.notifiable),
              )
            : null;

      if (mailable === null) {
        yield* Effect.logWarning(
          `EmailChannel: Expecting Mailable, got ${notification.entity}`,
        );
      }

      mailable.from([from_address, app_name]);
      mailable.to(notification.params.address);

      yield* mailable.send(mailer);
    });
  }
}
