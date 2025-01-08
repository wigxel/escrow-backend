import type { Effect } from "effect";
import { MailMessage } from "~/layers/notification/MailMessage";
import type { InferError, InferRequirements } from "~/services/effect.util";

export interface NotificationChannel {
  type: string;
  identifier: string;
  send(
    notification: NotificationEvent<unknown, unknown>,
  ): Effect.Effect<void, unknown, unknown>;
}

export interface NotificationEvent<Tame, T> {
  name: Tame;
  params: T;
  entity: Notification;
  notifiable: Notifiable;
}

export abstract class Notification {
  toMail(notifiable: Notifiable): MailMessage {
    return new MailMessage();
  }

  shouldSend(notifiable: Notifiable, channel: NotificationChannel): boolean {
    return true;
  }
}

export type Notifiable = {
  prefer_sms?: boolean;
  email?: boolean;
  id?: string;
  routes: Map<NotificationChannel["identifier"], NotificationChannel>;
};

export class AnonymousNotifiable implements Notifiable {
  prefer_sms = true;
  routes: Map<NotificationChannel["identifier"], NotificationChannel>;
}

interface NotificationFacadeInterface<
  TChannels extends NotificationChannel,
  TEvents extends NotificationEvent<unknown, unknown>,
  TErrors = never,
  TRequirements = never,
  TInvokedRoutes = never,
> {
  registerChannel(channel: NotificationChannel): void;

  route<const K extends TEvents["name"]>(
    providerKey: K,
    providerValue: Extract<TEvents, { name: K }>["params"],
  ): NotificationFacadeInterface<
    TChannels,
    TEvents,
    TErrors,
    TRequirements,
    TInvokedRoutes | Extract<TEvents, { name: K }>
  >;

  // emits a notification
  notify(
    data: Notification,
  ): Effect.Effect<
    void,
    InferInvokedErrors<TChannels, TInvokedRoutes>,
    InferInvokedRequirements<TChannels, TInvokedRoutes>
  >;

  // sends the same notification to multiple users
  // TODO: MISSING IMPLEMENTATION
  send(
    users: Notifiable[],
    notification: Notification,
  ): Effect.Effect<
    void,
    InferInvokedErrors<TChannels, TInvokedRoutes>,
    InferInvokedRequirements<TChannels, TInvokedRoutes>
  >;
  // users.forEach(e => e.notify(data))
}

type InferInvokedErrors<Channels, Events> = Channels extends NotificationChannel
  ? Parameters<Channels["send"]>[0] extends Events
    ? InferNChannelErrors<Channels>
    : never
  : never;

type InferInvokedRequirements<Channels, Events> =
  Channels extends NotificationChannel
    ? Parameters<Channels["send"]>[0] extends Events
      ? InferNChannelRequirements<Channels>
      : never
    : never;

type InferNChannelEvents<Channels> = Channels extends NotificationChannel
  ? Parameters<Channels["send"]>[0]
  : never;

type InferNChannelErrors<Channels> = Channels extends NotificationChannel
  ? InferError<ReturnType<Channels["send"]>>
  : never;

type InferNChannelRequirements<Channels> = Channels extends NotificationChannel
  ? InferRequirements<ReturnType<Channels["send"]>>
  : never;

export interface NotificationMediator<TChannels extends NotificationChannel>
  extends NotificationFacadeInterface<
    TChannels,
    InferNChannelEvents<TChannels>,
    InferNChannelErrors<TChannels>,
    InferNChannelRequirements<TChannels>
  > {}
