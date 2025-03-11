import { Context, Effect, Layer } from "effect";
import { EmailChannel } from "~/layers/notification/EmailChannel";
import { PushNotificationChannel } from "~/layers/notification/PushNotification";
import type { SMSChannel } from "~/layers/notification/SMSChannel";
import {
  AnonymousNotifiable,
  type Notifiable,
  type Notification,
  type NotificationChannel,
  type NotificationMediator,
} from "~/layers/notification/types";
import { InAppChannel } from "./in-app.Channel";
import type { Mailable } from "../mailing/mailables";

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
    if (!this.channels.has(channel_key)) {
      throw new Error(`Provider identify '${channel_key}' not register`);
    }

    this.events.push([
      channel_key,
      this.channels.get(channel_key),
      channel_config,
    ]);

    return this;
  }

  notify(payload: Notification | Mailable) {
    const events = this.events;
    const reset = () => {
      this.events = [];
    };
    const notifiable = this.notifiable;

    return Effect.gen(function* (_) {
      for (const [provider, channel, config] of events) {
        yield* channel.send({
          name: provider,
          params: config,
          entity: payload,
          notifiable: notifiable,
        }) as Effect.Effect<void>;
      }
    }).pipe(Effect.tap(() => reset()));
  }

  send(users: Notifiable[], data: Notification): Effect.Effect<void> {
    return Effect.void;
  }
}

export function make<T>() {
  return Context.Tag("NotificationFacade")<
    T,
    NotificationMediator<AvailableChannels>
  >();
}

/**
 *   ```ts
 *   const notification = yield* NotificationFacade;
 *   yield* notification
 *     .route("mail", { address: "joseph.owonwo@gmail.com" })
 *     .route("sms", { phoneNumber: "+2347045565397" })
 *     .notify(new OrderTesting())
 *  ```
 */
export class NotificationFacade extends Context.Tag("NotificationFacade")<
  NotificationFacade,
  NotificationMediator<AvailableChannels>
>() {}

export const NotificationLive = Layer.sync(NotificationFacade, () => {
  const instance = new NotificationManager<AvailableChannels>();
  instance.registerChannel(new EmailChannel());
  instance.registerChannel(new InAppChannel());
  instance.registerChannel(new PushNotificationChannel());

  return instance;
});
