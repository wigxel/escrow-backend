import { Context, Effect, Layer } from "effect";
import type { Mailable } from "~/layers/mailing/mailables";
import type { EmailChannel } from "~/layers/notification/EmailChannel";
import type { InAppChannel } from "~/layers/notification/in-app.Channel";
import type { PushNotificationChannel } from "~/layers/notification/PushNotification";
import type { SMSChannel } from "~/layers/notification/SMSChannel";
import {
  AnonymousNotifiable,
  type Notifiable,
  type Notification,
  type NotificationChannel,
  type NotificationMediator,
} from "~/layers/notification/types";


type AvailableChannels =
  | EmailChannel
  | SMSChannel
  | PushNotificationChannel
  | InAppChannel;

export class NotificationManager<TChannels extends NotificationChannel>
  implements NotificationMediator<TChannels>
{
  private channels = new Map();
  private events: [string, NotificationChannel, unknown][] = [];
  private notifiable: Notifiable;

  constructor() {
    this.notifiable = new AnonymousNotifiable();
  }

  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.identifier, channel);
  }

  route(channel_key, channel_config) {
    return this;
  }

  notify(payload: Notification | Mailable) {
    return Effect.succeed(1);
  }

  send(users: Notifiable[], data: Notification): Effect.Effect<void> {
    return Effect.void;
  }
}
export class NotificationFacade extends Context.Tag("NotificationFacade")<
  NotificationFacade,
  NotificationMediator<AvailableChannels>
>() {}

export const NotificationFacadeTestLive = Layer.succeed(
  NotificationFacade,
  new NotificationManager<AvailableChannels>(),
);
